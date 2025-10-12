import React from "react";
import { View, Image, TouchableOpacity, useWindowDimensions } from "react-native";
import { Text } from "react-native-paper";
import { MessageT } from "../types";
import styles, { WIDESCREEN_HORIZONTAL_MAX } from "../assets/styles";
import * as I18N from "../i18n";
import * as Global from "../Global";
import { format, formatDistanceToNow, isToday } from 'date-fns';
import { zhCN } from 'date-fns/locale';

const i18n = I18N.getI18n()

const Message = ({ conversation }: MessageT) => {

  let text: string = !conversation.lastMessage ? "" : conversation.lastMessage.from ? "" : i18n.t('you') + ": ";
  text += conversation.lastMessage ? conversation.lastMessage.content : i18n.t('chat.default');
  const { width } = useWindowDimensions();
    const smartFormat = (date: string | number | Date) => {
        if (isToday(date)) {
            return format(date, 'HH:mm');
        } else {
            return format(date, 'MM-dd HH:mm');
        }
    };

  return (
    <View style={{marginTop:10,flexDirection: 'row',
        height:75,
        borderBottomWidth:3,
        borderLeftWidth:3,borderStyle:'solid',
        borderColor:'white',borderRadius:10}}>
      <View>
        <TouchableOpacity onPress={() => Global.nagivateProfile(undefined, conversation.uuid)} >
          <Image source={{ uri: conversation.userProfilePicture }} style={{
              borderRadius: 30,
              width: 50,
              height: 50,
              marginRight: 10,
              marginVertical: 15,
          }} />
        </TouchableOpacity>
      </View>
      <View style={[{ flexGrow: 1, justifyContent: 'center' }]}>
        <TouchableOpacity onPress={() => Global.nagivateChatDetails(conversation)} >
          <Text style={{
              fontSize: 22,
              fontWeight:"700",
              marginBottom:5
          }}>{conversation.userName}</Text>
          <Text numberOfLines={1} style={[styles.message, {maxWidth: (width > WIDESCREEN_HORIZONTAL_MAX ? WIDESCREEN_HORIZONTAL_MAX : width) - 120}]}>{text}</Text>
          <Text style={{fontStyle:'italic',color:'#a3a3a3',
              position:'absolute',right:0,top:6
          }}>
              {smartFormat(conversation.lastUpdated)}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  )
};

export default Message;
