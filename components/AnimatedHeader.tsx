import React, {useState, useRef, useEffect} from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Animated,
    StatusBar,
    Image,
    Platform,
} from 'react-native';
import {Icon, Message} from "../components";
import styles from "../assets/styles";
import * as I18N from "../i18n";

const AnimatedHeader = ({
                            // 基础属性
                            title = '',
                            backgroundColor = '#fff',
                            statusBarBackground = '#fff',
                            statusBarStyle = 'dark-content',

                            // 搜索功能属性
                            showSearch = true,
                            searchPlaceholder = '',
                            onSearch=function (item:any){}, // 搜索回调函数
                            onSearchTextChange=function (item:any){}, // 搜索文本变化回调

                            // 菜单功能属性
                            showMenu = true,
                            onMenuPress=function (){}, // 菜单点击回调

                            userInfo = {
                                name: '用户名',
                                avatar: null, // 头像 URL 或 require('./path/to/image')
                                email: 'user@example.com',
                                isOnline: true
                            },

                            // 样式自定义
                            titleStyle = {},
                            containerStyle = {},
                            searchContainerStyle = {},
                            onMenuItemPress = function (itemId: string) {},
                            menuItems = [
                                { id: 'profile', title: '个人资料', icon: 'person' },
                                { id: 'settings', title: '设置', icon: 'settings' },
                                { id: 'logout', title: '退出登录', icon: 'exit' }
                            ],


                        }) => {
    // 状态管理
    const [isExpanded, setIsExpanded] = useState(false);
    const [searchText, setSearchText] = useState('');
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const i18n = I18N.getI18n()
    // 动画引用
    const searchWidth = useRef(new Animated.Value(40)).current;
    const inputRef = useRef(null);
    const menuHeight = useRef(new Animated.Value(0)).current;
    const menuOpacity = useRef(new Animated.Value(0)).current;

    // 展开菜单
    const openMenu = () => {
        // setIsMenuOpen(true);
        // Animated.parallel([
        //     Animated.timing(menuHeight, {
        //         toValue: 280, // 菜单高度
        //         duration: 300,
        //         useNativeDriver: false,
        //     }),
        //     Animated.timing(menuOpacity, {
        //         toValue: 1,
        //         duration: 300,
        //         useNativeDriver: false,
        //     })
        // ]).start();
    };

    // 关闭菜单
    const closeMenu = () => {
        Animated.parallel([
            Animated.timing(menuHeight, {
                toValue: 0,
                duration: 250,
                useNativeDriver: false,
            }),
            Animated.timing(menuOpacity, {
                toValue: 0,
                duration: 250,
                useNativeDriver: false,
            })
        ]).start(() => {
            setIsMenuOpen(false);
        });
    };

    // 切换菜单状态
    const toggleMenu = () => {
        if (isMenuOpen) {
            closeMenu();
        } else {
            openMenu();
        }
    };

    // 处理菜单项点击
    const handleMenuItemPress = (itemId: string) => {
        onMenuItemPress(itemId);
        closeMenu();

        // 根据不同的菜单项执行不同操作
        switch (itemId) {
            case 'profileSettings':
                // 跳转到个人资料页面
                if (onMenuPress) {
                    onMenuPress();
                }
                break;
            case 'Settings':
                // 跳转到设置页面
                console.log('跳转到设置');
                break;
            default:
                break;
        }
    };

    // 点击菜单外部关闭菜单
    useEffect(() => {
        const handleBackButton = () => {
            if (isMenuOpen) {
                closeMenu();
                return true; // 阻止默认返回行为
            }
            return false;
        };

        // 监听返回按钮（Android）
        if (Platform.OS === 'android') {
            // 这里可以添加硬件返回按钮监听
        }

        return () => {
            // 清理监听器
        };
    }, [isMenuOpen]);

    // 展开搜索框
    const expandSearch = () => {
        setIsExpanded(true);
        Animated.timing(searchWidth, {
            toValue: 200,
            duration: 300,
            useNativeDriver: false,
        }).start(() => {
        });
    };

    // 收起搜索框
    const collapseSearch = () => {
        setIsExpanded(false);
        setSearchText('');
        Animated.timing(searchWidth, {
            toValue: 40,
            duration: 300,
            useNativeDriver: false,
        }).start();

        // 通知父组件搜索已取消
        if (onSearchTextChange) {
            onSearchTextChange('');
        }
    };

    // 处理搜索提交
    const handleSearch = () => {
        if (onSearch && searchText.trim()) {
            onSearch(searchText.trim());
        }
    };

    // 处理搜索文本变化
    const handleSearchTextChange = (text: React.SetStateAction<string>) => {
        setSearchText(text);
        if (onSearchTextChange) {
            onSearchTextChange(text);
        }
    };

    // 处理菜单点击
    const handleMenuPress = () => {
        if (onMenuPress) {
            onMenuPress();
        }
    };

    // 处理菜单按钮点击
    const handleMenuButtonPress = () => {
        toggleMenu();
    };

    return (
        <View style={[styleses.container,styles.backColor]}>
            <StatusBar
                backgroundColor={statusBarBackground}
            />
            <View style={styleses.header}>
                {/* 左侧标题和菜单 */}
                <View style={styleses.titleContainer}>
                    {showMenu && (
                        <TouchableOpacity onPress={handleMenuButtonPress}>
                            <Icon
                                name={isMenuOpen ? "close" : "menu"}
                                size={30}
                                color="white"
                            />
                        </TouchableOpacity>
                    )}
                    <Text style={[styleses.title, titleStyle]}>{title}</Text>
                </View>

                {/* 右侧搜索区域 */}
                {showSearch && (
                    <View style={styleses.searchWrapper}>
                        <Animated.View
                            style={[
                                styleses.searchContainer,
                                { width: searchWidth },
                                searchContainerStyle
                            ]}
                        >
                            {isExpanded ? (
                                <>
                                    <TextInput
                                        ref={inputRef}
                                        style={styleses.searchInput}
                                        placeholder={i18n.t('chat.search')}
                                        placeholderTextColor="#999"
                                        value={searchText}
                                        onChangeText={handleSearchTextChange}
                                        returnKeyType="search"
                                        onSubmitEditing={handleSearch}
                                    />
                                    <TouchableOpacity
                                        onPress={collapseSearch}
                                        style={styleses.closeButton}
                                    >
                                        <Icon name="close" size={20} color="white" />
                                    </TouchableOpacity>
                                </>
                            ) : (
                                <TouchableOpacity onPress={expandSearch} style={styleses.searchIconButton}>
                                    <Icon name="search" size={24} color="white" />
                                </TouchableOpacity>
                            )}
                        </Animated.View>
                    </View>
                )}
            </View>
            {/* 展开的菜单 */}
            {isMenuOpen && (
                <TouchableOpacity
                    style={styleses.menuOverlay}
                    activeOpacity={1}
                    onPress={closeMenu}
                >
                    <Animated.View
                        style={[
                            styleses.menuContainer,
                            {
                                height: menuHeight,
                                opacity: menuOpacity
                            }
                        ]}
                    >
                        {/* 用户信息区域 */}
                        <View style={styleses.userInfoSection}>
                            <View style={styleses.avatarContainer}>
                                {userInfo.avatar ? (
                                    <Image source={{ uri: userInfo.avatar }} style={ styleses.avatar }/>
                                ) : (
                                    <View style={styleses.defaultAvatar}>
                                        <Icon name="person" size={30} color="#666" />
                                    </View>
                                )}
                                <View style={[
                                    styleses.onlineStatus,
                                    { backgroundColor: userInfo.isOnline ? '#4CAF50' : '#9E9E9E' }
                                ]} />
                            </View>
                            <Text style={styleses.userName}>{userInfo.name}</Text>
                            <Text style={styleses.userEmail}>{userInfo.email}</Text>
                        </View>

                        {/* 菜单项列表 */}
                        <View style={styleses.menuItemsContainer}>
                            {menuItems.map((item) => (
                                <TouchableOpacity
                                    key={item.id}
                                    style={styleses.menuItem}
                                    onPress={() => handleMenuItemPress(item.id)}
                                >
                                    <Icon
                                        name={item.icon}
                                        size={20}
                                        color="#666"
                                        style={styleses.menuItemIcon}
                                    />
                                    <Text style={styleses.menuItemText}>{item.title}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </Animated.View>
                </TouchableOpacity>
            )}
        </View>
    );
};

const styleses = StyleSheet.create({
    container: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 500,
        paddingTop: Platform.OS === 'ios' ? 50 : 45,
        paddingHorizontal: 16,
        paddingBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    titleContainer: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#ffffff',
        marginLeft: 28,
    },
    searchWrapper: {
        marginLeft: 'auto',
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 20,
        paddingHorizontal: 12,
        height: 40,
        overflow: 'hidden',
    },
    searchIconButton: {
        width: 30,
        height: 30,
        justifyContent: 'center',
        alignItems: 'center',
    },
    searchInput: {
        height: 30,
        flex: 1,
        fontSize: 16,
        backgroundColor: '#fff',
        color: '#000000',
        padding: 5,
        marginRight: 8,
        borderRadius: 15,
    },
    closeButton: {
        padding: 4,
    },
    // 菜单相关样式
    menuOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        zIndex: 1001,
    },
    menuContainer: {
        position: 'absolute',
        top: Platform.OS === 'ios' ? 100 : 85,
        left: 16,
        right: 16,
        backgroundColor: 'white',
        borderRadius: 12,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 8,
    },
    userInfoSection: {
        padding: 20,
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    avatarContainer: {
        position: 'relative',
        marginBottom: 12,
    },
    avatar: {
        width: 60,
        height: 60,
        borderRadius: 30,
    },
    defaultAvatar: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: '#f0f0f0',
        justifyContent: 'center',
        alignItems: 'center',
    },
    onlineStatus: {
        position: 'absolute',
        bottom: 2,
        right: 2,
        width: 14,
        height: 14,
        borderRadius: 7,
        borderWidth: 2,
        borderColor: 'white',
    },
    userName: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 4,
    },
    userEmail: {
        fontSize: 14,
        color: '#666',
    },
    menuItemsContainer: {
        paddingVertical: 8,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 20,
    },
    menuItemIcon: {
        marginRight: 12,
        width: 24,
    },
    menuItemText: {
        fontSize: 16,
        color: '#333',
    },
});

export default AnimatedHeader;