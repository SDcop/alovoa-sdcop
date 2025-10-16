import React, {useCallback, useEffect, useRef, useState} from "react";
import {
    View,
    RefreshControl,
    ScrollView,
    useWindowDimensions,
    Image,
    ImageBackground,
    TouchableOpacity, Dimensions
} from "react-native";
import {
    UserDto,
    SearchResource,
    SearchDto,
    UnitsEnum,
    SearchParams,
    SearchParamsSortE,
    RootStackParamList
} from "../types";
import * as I18N from "../i18n";
import * as Global from "../Global";
import * as URL from "../URL";
import * as Location from 'expo-location';
import {ActivityIndicator, Text, Button, IconButton, MaterialBottomTabScreenProps, useTheme} from "react-native-paper";
import CardItemSearch from "../components/CardItemSearch";
import {useFocusEffect} from "@react-navigation/native";
import ComplimentModal from "../components/ComplimentModal";
import SearchEmpty from "../assets/images/search-empty.svg";
import styles, {WIDESCREEN_HORIZONTAL_MAX, STATUS_BAR_HEIGHT} from "../assets/styles";
import AnimatedHeader from "../components/AnimatedHeader";
import {Icon} from "../components";
import {MaterialCommunityIcons} from "@expo/vector-icons";

const i18n = I18N.getI18n()

type Props = MaterialBottomTabScreenProps<RootStackParamList, 'Search'>
const Search = ({route, navigation}: Props) => {

    const {colors} = useTheme();
    let swiper: any = React.useRef(null);
    const [refreshing] = React.useState(false); // todo: setRefreshing
    const [user, setUser] = React.useState<UserDto>();
    const [results, setResults] = useState(Array<UserDto>);
    const [stackKey, setStackKey] = React.useState(0);
    const [firstSearch, setFirstSearch] = React.useState(true);
    const [loading, setLoading] = React.useState(false);
    const [index, setIndex] = React.useState(0);
    const [currentUser, setCurrentUser] = React.useState<UserDto>();
    const [complimentModalVisible, setComplimentModalVisible] = React.useState(false);
    const [ignoreRightSwipe, setIgnoreRightSwipe] = React.useState(false);
    const [loaded, setLoaded] = React.useState(false);
    const [removingIndex, setRemovingIndex] = useState(null);
    const resultsRef = useRef(results);

    let latitude: number | undefined;
    let longitude: number | undefined;

    const svgHeight = 150;
    const svgWidth = 200;

    const {height, width} = useWindowDimensions();

    const LOCATION_TIMEOUT_SHORT = Global.DEFAULT_GPS_TIMEOUT;
    const LOCATION_TIMEOUT_LONG = LOCATION_TIMEOUT_SHORT * 10;
    const { height: screenHeight } = Dimensions.get('window');

    const promiseWithTimeout = (timeoutMs: number, promise: Promise<any>) => {
        return Promise.race([
            promise,
            new Promise((_resolve, reject) => setTimeout(() => reject(), timeoutMs)),
        ]);
    }

    React.useEffect(() => {
        setStackKey(new Date().getTime());
        for (let i = 0; i < results.length; i++) {
            swiper.current?.goBackFromTop();
        }
    }, [results]);

    React.useEffect(() => {
        Global.SetStorage(Global.STORAGE_SEARCH_REMOVE_TOP, Global.STORAGE_FALSE);
        load();
    }, []);

    React.useEffect(() => {
        if (results[index]) {
            setCurrentUser(results[index]);
        }
    }, [index, results]);

    useFocusEffect(
        React.useCallback(() => {
            Global.GetStorage(Global.STORAGE_RELOAD_SEARCH).then(value => {
                if (value === Global.STORAGE_TRUE) {
                    load();
                    Global.SetStorage(Global.STORAGE_RELOAD_SEARCH, "");
                } else {
                    Global.GetStorage(Global.STORAGE_SEARCH_REMOVE_TOP).then(value => {
                        if (value && value === Global.STORAGE_TRUE) {
                            swiper.current?.swipeTop();
                            let resultsCopy = [...results];
                            resultsCopy.shift();
                            setResults(resultsCopy);
                            navigation.setParams({changed: false});
                            if (resultsCopy.length === 0) {
                                load();
                            }
                        }
                        Global.SetStorage(Global.STORAGE_SEARCH_REMOVE_TOP, Global.STORAGE_FALSE);
                    });
                }
            });
        }, [route, navigation])
    );

    async function load() {
        setLoaded(false);
        setResults([]);
        setLoading(true);
        let l1 = await Global.GetStorage(Global.STORAGE_LATITUDE);
        latitude = l1 ? Number(l1) : undefined;
        let l2 = await Global.GetStorage(Global.STORAGE_LONGITUDE);
        longitude = l2 ? Number(l2) : undefined;
        await Global.Fetch(URL.API_RESOURCE_YOUR_PROFILE).then(
            async (response) => {
                let data: SearchResource = response.data;
                if (!latitude) {
                    latitude = data.user.locationLatitude;
                }
                if (!longitude) {
                    longitude = data.user.locationLongitude;
                }
                setUser(data.user);
                await updateLocationLocal(data.user.locationLatitude, data.user.locationLongitude);
                await loadResults();
            }
        );
        setLoading(false);
        setIndex(0);
        setLoaded(true);
    }

    async function updateLocationLocal(lat: number, lon: number) {
        await Global.SetStorage(Global.STORAGE_LATITUDE, String(lat));
        latitude = lat;
        await Global.SetStorage(Global.STORAGE_LONGITUDE, String(lon));
        longitude = lon;
    }

    async function loadResults() {

        let lat = latitude;
        let lon = longitude;
        let hasLocation = lat !== undefined && lon !== undefined;
        if (firstSearch) {
            try {
                let location: Location.LocationObject | undefined;
                let hasLocationPermission = false;
                let hasGpsEnabled = false;
                let {status} = await Location.requestForegroundPermissionsAsync();
                if (status === 'granted') {
                    hasLocationPermission = true;
                    try {
                        let storedGpsTimeout = await Global.GetStorage(Global.STORAGE_ADV_SEARCH_GPSTIMEOPUT);
                        let gpsTimeout = storedGpsTimeout ?
                            hasLocation ? Math.max(LOCATION_TIMEOUT_SHORT, Number(storedGpsTimeout)) : Math.max(LOCATION_TIMEOUT_LONG, Number(storedGpsTimeout)) :
                            hasLocation ? LOCATION_TIMEOUT_SHORT : LOCATION_TIMEOUT_LONG;
                        location = await promiseWithTimeout(gpsTimeout, Location.getCurrentPositionAsync({}));
                        hasGpsEnabled = true;
                        lat = location?.coords.latitude;
                        lon = location?.coords.longitude;
                    } catch (e) {
                        console.error(e);
                    }
                }
                if (!hasLocationPermission) {
                    Global.ShowToast(i18n.t('location.no-permission'));
                } else if (!hasGpsEnabled) {
                    Global.ShowToast(i18n.t('location.no-signal'));
                }
                setFirstSearch(false);
            } catch (e) {
                console.error(e)
            }
        }

        if (lat !== undefined && lon !== undefined) {

            let paramsStorage = await Global.GetStorage(Global.STORAGE_ADV_SEARCH_PARAMS);
            let storedParams: SearchParams = paramsStorage ? JSON.parse(paramsStorage) : {};

            let searchParams: SearchParams = {
                distance: storedParams?.distance ? storedParams.distance : Global.DEFAULT_DISTANCE,
                showOutsideParameters: storedParams?.showOutsideParameters === undefined ? true : storedParams.showOutsideParameters,
                sort: SearchParamsSortE.DEFAULT,
                latitude: lat,
                longitude: lon,
                miscInfos: [],
                intentions: [],
                interests: [],
                preferredGenderIds: user ? user.preferedGenders.map(gender => gender.id) : []
            };

            //console.log(searchParams)
            let response = await Global.Fetch(URL.API_SEARCH, 'post', searchParams);
            let result: SearchDto = response.data;
            if (result.users) {
                setResults(result.users);
            }
        }
    }

    async function likeUser (id:string,message?: string, pop?: boolean) {
        await (async () => {
            if (index < results.length) {
                if (!message) {
                    await Global.Fetch(Global.format(URL.USER_LIKE, id), 'post');
                } else {
                    await Global.Fetch(Global.format(URL.USER_LIKE_MESSAGE, id, message), 'post');
                }
                load()
            }
        })();
    }

    async function loadResultsOnEmpty(index: number) {
        if (index === results.length - 1) {
            load();
        }
    }

    // async function hideUser(index: number) {
    //   if (index < results.length) {
    //     let id = results[index].uuid;
    //     await Global.Fetch(Global.format(URL.USER_HIDE, id), 'post');
    //     loadResultsOnEmpty(index);
    //   }
    //   setIndex(index + 1);
    // }

    // 同步 ref 和 state


    function onComplimentModalDismiss() {
        setIgnoreRightSwipe(false);
    }

    function openSearchSetting() {
        Global.navigate(Global.SCREEN_PROFILE_SEARCHSETTINGS, false, {})
    }

    return (
        <View>
            <AnimatedHeader
                title={i18n.t('navigation.search')}
                showSearch={false}
            />
            <View style={[styles.top, {
                position: "absolute",
                width: '100%',
                marginHorizontal: 0,
                paddingTop: screenHeight*0.05,
                justifyContent: 'flex-end',
                zIndex: 1000,
            }]}>
                {width > WIDESCREEN_HORIZONTAL_MAX &&
                    <Button icon="cog" mode="elevated"
                            contentStyle={{flexDirection: 'row-reverse', justifyContent: 'space-between'}}
                            style={{alignSelf: 'stretch', marginBottom: 8}} onPress={openSearchSetting}>
                        {i18n.t('profile.screen.search')}</Button>
                }
                {width <= WIDESCREEN_HORIZONTAL_MAX &&
                    <IconButton
                        icon="cog"
                        mode="contained"
                        size={20}
                        onPress={() => Global.navigate(Global.SCREEN_PROFILE_SEARCHSETTINGS, false, {})}
                    />
                }
            </View>
            <ScrollView style={{minHeight:screenHeight*0.8}}
                        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={load}/>}>
                {loading &&
                    <View style={{
                        height: height,
                        width: width,
                        justifyContent: 'center',
                        alignItems: 'center',
                        position: "absolute"
                    }}>
                        <ActivityIndicator animating={loading} size="large"/>
                    </View>
                }
                <View style={{marginTop: screenHeight*0.06+40, flexDirection: 'column', alignItems: 'center', overflow: "hidden"}}>
                    {
                        results.map((card, index) => (
                            <View key={index} style={{
                                overflow: "hidden",
                                borderWidth: 5,
                                borderStyle: 'solid',
                                borderColor: "#f681a4",
                                borderRadius: 10,
                                marginTop: 30,
                            }}>
                                <ImageBackground source={require('../assets/back.png')} style={{
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    padding: 0,
                                }} resizeMode="cover">
                                    <View key={index} style={{
                                        height: 160,
                                        width: '98%',
                                        flexDirection: 'row',
                                        alignItems: 'center'
                                    }}>
                                        <View style={{
                                            flexDirection: 'column',
                                            alignItems: 'flex-start',
                                            justifyContent: 'space-between',
                                            width: 130
                                        }}>
                                            <TouchableOpacity onPress={() => Global.nagivateProfile(undefined, card.uuid)}>
                                                <Image source={{uri: card.profilePicture}}
                                                       style={{height: 100, width: 100, borderRadius: 10, margin: 10}}/>
                                            </TouchableOpacity>
                                            <TouchableOpacity onPress={()=>likeUser(card.uuid,undefined,false)} style={{
                                                flex: 1,
                                                width: 120,
                                                height: 20,
                                                backgroundColor: "white",
                                                marginTop: 5,
                                                marginBottom: 5,
                                                borderRadius: 30,
                                                borderWidth:1,
                                                borderColor:'#fba5c8',
                                                paddingVertical: 0,
                                                flexDirection: 'row',
                                                justifyContent: 'space-around',
                                                alignItems: 'center'
                                            }}>
                                                <Icon name={"heart"} color={"#fb4545"} size={30}></Icon>
                                                <Text style={{fontSize: 18}}>{i18n.t("profile.search.button-like")}  </Text>
                                            </TouchableOpacity>
                                        </View>
                                        <View style={{flexDirection: 'column', width: "60%"}}>
                                            <View style={{flexDirection: 'row'}}>
                                                <Text style={{fontSize: 18}}>{card.firstName},{card.age}</Text>
                                                {card.gender.text === 'male' && (
                                                    <Icon name="male" size={18} color="#007AFF"/>
                                                )}
                                                {card.gender.text === 'female' && (
                                                    <Icon name="female" size={18} color="#fb4545"/>
                                                )}
                                                <View style={{position:'absolute',right:0, flexDirection: 'row', alignItems: 'center' }}>
                                                    <MaterialCommunityIcons name="map-marker" size={18} style={[{ paddingRight: 4, color: colors?.secondary }]} />
                                                    <Text>{card.distanceToUser}</Text>
                                                    <Text>{card.units ? ' mi' : ' km'}</Text>
                                                </View>
                                            </View>
                                            <View style={{
                                                height: 95,
                                                backgroundColor: 'rgba(255,255,255,0.71)',
                                                borderRadius: 20,
                                                overflow: 'hidden',
                                                marginTop:10
                                            }}>
                                                <Text numberOfLines={4} ellipsizeMode="tail" style={{
                                                    fontSize: 15,
                                                    lineHeight: 24,
                                                    alignSelf: 'center',
                                                    color:'#717171'
                                                }}>{card.description}</Text>
                                            </View>
                                        </View>
                                    </View>
                                </ImageBackground>
                            </View>
                        ))
                    }
                </View>
                {results && results.length === 0 && loaded &&
                    <View style={{height: height, width: '100%', justifyContent: 'center', alignItems: 'center'}}>
                        <View style={[styles.center, {maxWidth: WIDESCREEN_HORIZONTAL_MAX}]}>
                            <SearchEmpty height={svgHeight} width={svgWidth}></SearchEmpty>
                            <Text style={{
                                fontSize: 20,
                                paddingHorizontal: 48,
                                marginTop: 8
                            }}>{i18n.t('search-empty.title')}</Text>
                            <Text style={{
                                marginTop: 24,
                                opacity: 0.6,
                                paddingHorizontal: 48,
                                textAlign: 'center'
                            }}>{i18n.t('search-empty.subtitle')}</Text>
                            <Button onPress={openSearchSetting}>{i18n.t('search-empty.button')}</Button>
                        </View>
                    </View>
                }
            </ScrollView>
        </View>
    );
};

export default Search;
