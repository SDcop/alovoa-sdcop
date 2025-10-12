import React from "react";
import { formatMessageTime, shouldShowTime, formatDividerTime } from '../plugins/timeUtils';
import {
  View,
  RefreshControl,
  KeyboardAvoidingView,
  Keyboard,
  Image,
  ScrollView,
  useWindowDimensions, TouchableOpacity, StyleSheet
} from "react-native";
import {
  TextInput, Card, MaterialBottomTabScreenProps
} from "react-native-paper";
import { useTheme, Text } from "react-native-paper";
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Autolink, { CustomMatcher } from 'react-native-autolink';
import { MessageDtoListModel, MessageDto, RootStackParamList } from "../types";
import styles from "../assets/styles";
import * as Global from "../Global";
import * as URL from "../URL";
import * as I18N from "../i18n";

const i18n = I18N.getI18n()
const SECOND_MS = 1000;
const POLL_MESSAGE = 5 * SECOND_MS;

type Props = MaterialBottomTabScreenProps<RootStackParamList, 'MessageDetail'>
const MessageDetail = ({ route, navigation }: Props) => {

  const { conversation } = route.params;
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { height, width } = useWindowDimensions();
  const [refreshing] = React.useState(false); // todo: setRefreshing
  const [results, setResults] = React.useState(Array<MessageDto>);
  let scrollViewRef = React.useRef<ScrollView>(null);
  const [text, setText] = React.useState("");

  const PhoneMatcher: CustomMatcher = {
    pattern:
      /(?<=^|\s|\.)[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{0,6}(?=$|\s|\.)/gm,
    type: 'phone-intl',
    getLinkUrl: ([number]) => `tel:${number}`,
  };

  let messageUpdateInterval: NodeJS.Timeout | null = null;

  React.useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', () => {
      if (messageUpdateInterval) {
        clearInterval(messageUpdateInterval);
      }
    });
    return unsubscribe;
  }, [navigation]);

  React.useEffect(() => {
    navigation.setOptions({
      headerTitle: () => (
          <View style={{flexDirection:"row",alignItems:"center"}}>
            <Image source={{ uri: conversation.userProfilePicture }} style={{ height: 40, width: 40, borderRadius: 36}} />
            <Text style={{marginLeft:5,fontSize:25}}>{conversation.userName}</Text>
          </View>
      )
    });
    load();
    messageUpdateInterval = setInterval(() => {
      reloadMessages(false);
    }, POLL_MESSAGE);
  }, []);

  React.useEffect(() => {
    scrollToEnd();
  }, [results]);

  function scrollToEnd() {
    setTimeout(function () {
      scrollViewRef?.current?.scrollToEnd();
    }, 100);
  }

  async function load() {
    reloadMessages(true);
  }

  async function reloadMessages(first: boolean) {
    let firstVal = first ? "1" : "0";
    let response = await Global.Fetch(Global.format(URL.API_MESSAGE_UPDATE, conversation.id, firstVal));
    let data: MessageDtoListModel = response.data;
    if (data.list) {
      setResults(data.list);
    }
  }

  async function sendMessage() {
    await Global.Fetch(Global.format(URL.MESSAGE_SEND, conversation.id), 'post', text, 'text/plain');
    reloadMessages(false);
    setText("");
    Keyboard.dismiss();
  }

  return (
    <View style={[styles.containerMessages, { paddingHorizontal: 0, display: 'flex', maxHeight: height, marginBottom: insets.bottom }]}>
      <ScrollView
          style={{ padding: 8, flexGrow: 1 }}
          ref={scrollViewRef}
          contentContainerStyle={{ paddingBottom: 8 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={load} />}
      >
        {results.map((item, index) => {
          const showDivider = shouldShowTime(item, results[index - 1]);

          return (
              <View key={item.id || index}>
                {/* 时间分隔线（5分钟以上间隔显示） */}
                {showDivider && (
                    <View style={styleses.timeDivider}>
                      <Text style={styleses.timeDividerText}>
                        {formatDividerTime(item.date)}
                      </Text>
                    </View>
                )}

                <View style={[
                  { flex: 1, marginBottom: 4 },
                  item.from ? { alignItems: 'flex-start' } : { alignItems: 'flex-end' }
                ]}>
                  <Card style={[
                    styleses.messageBubble,
                    item.from ? styleses.otherBubble : styleses.yourBubble
                  ]}>
                    <Autolink
                        style={item.from ? styleses.otherText : styleses.yourText}
                        text={item.content}
                        linkStyle={{ textDecorationLine: 'underline' }}
                        email={false}
                        phone={true}
                        matchers={[PhoneMatcher]}
                        component={Text}
                    />
                  </Card>

                  {/* 每条消息的精确时间 */}
                  <Text style={[
                    styleses.messageTime,
                    item.from ? styleses.otherTime : styleses.yourTime
                  ]}>
                    {formatMessageTime(item.date)}
                  </Text>
                </View>
              </View>
          );
        })}
      </ScrollView>
      <KeyboardAvoidingView>
        <TextInput
          style={{ backgroundColor: colors.surface, height: 52 }}
          value={text}
          dense={true}
          maxLength={Global.MAX_MESSAGE_LENGTH}
          onChangeText={text => setText(text)}
          onSubmitEditing={sendMessage}
          placeholder={i18n.t('chat.placeholder')}
          right={<TextInput.Icon color={colors.secondary} onPress={() => sendMessage()} icon="send" />}></TextInput>
      </KeyboardAvoidingView>
    </View>
  )
};
const styleses = StyleSheet.create({
  messageBubble: {
    padding: 12,
    maxWidth: '80%',
  },
  otherBubble: {
    backgroundColor: '#f0f0f0',
  },
  yourBubble: {
    backgroundColor: '#007AFF',
  },
  otherText: {
    color: '#000',
  },
  yourText: {
    color: '#fff',
  },
  messageTime: {
    fontSize: 11,
    color: '#999',
    marginTop: 2,
    marginHorizontal: 5,
  },
  otherTime: {
    textAlign: 'left',
  },
  yourTime: {
    textAlign: 'right',
  },
  timeDivider: {
    alignItems: 'center',
    marginVertical: 16,
  },
  timeDividerText: {
    fontSize: 12,
    color: '#999',
    backgroundColor: 'rgba(0,0,0,0.1)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
});
export default MessageDetail;
