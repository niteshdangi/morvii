import React, { Component } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { setShortModal, setShortModalProps } from "../actions/ShortModal";
import { connect } from "react-redux";
import {
  StatusBar,
  Dimensions,
  Image,
  Animated,
  View,
  PanResponder,
} from "react-native";
import { Layout, Text, Button, Icon } from "@ui-kitten/components";
import StoryView from "./home/stories";
import {
  TouchableWithoutFeedback,
  FlatList,
  TouchableOpacity,
} from "react-native-gesture-handler";
import timeSince from "./utils/TimeSince";
import { LinearGradient } from "expo-linear-gradient";
import { Rating } from "react-native-ratings";
import { Easing } from "react-native-reanimated";
import * as Constants from "./Constants";
import DoubleClick from "react-native-double-tap";
import Footer from "./utils/Footer";
import Ripple from "react-native-material-ripple";
import Swiper from "react-native-swiper";
import {
  hideNavigationBar,
  showNavigationBar,
} from "react-native-navigation-bar-color";

import PinchableBox from "./home/PinchableImage";
class Mopic extends Component {
  state = {
    captionFull: false,
    liked: this.props?.item?.liked,
    likes: this.props?.item?.likes,
    selfRate: false,
    rate: this.props.item.rate,
    user: this.props.item.user,
  };
  convertInt(int) {
    return int
      ? int < 1000
        ? int
        : int < 1000000
        ? Math.round(int / 1000) + "K"
        : Math.round(int / 1000000) + "M"
      : 0;
  }
  like() {
    this.setState({
      liked: !this.state.liked,
    });
    fetch(Constants.API_URL + "/mopic/" + this.props?.item?.id + "/like/", {
      method: "POST",
      headers: {
        Accept: "application/json",
        Authorization: "Token " + this.props.auth.token,
        "Content-Type": "application/json",
      },
    })
      .then((response) => {
        const statusCode = response.status;
        const data = response.json();
        return Promise.all([statusCode, data]);
      })
      .then(([statusCode, data]) => {
        if (statusCode === 200) {
          this.setState({
            liked: data.liked,
            likes: data.likes,
          });
        } else {
          this.setState({
            liked: !this.state.liked,
          });
        }
      })
      .catch(() => {
        this.setState({
          liked: !this.state.liked,
        });
      });
  }

  onRateChange(value) {
    this.setState({ selfRate: true });
    fetch(Constants.API_URL + "/mopic/" + this.props?.item?.id + "/rate/", {
      method: "POST",
      headers: {
        Accept: "application/json",
        Authorization: "Token " + this.props.auth.token,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ rate: value }),
    })
      .then((response) => {
        const statusCode = response.status;
        const data = response.json();
        return Promise.all([statusCode, data]);
      })
      .then(([statusCode, data]) => {
        this.setState({ rate: data.rate });
      })
      .catch(() => {});
  }
  ratingOpacity = new Animated.Value(0);
  ratingTranslate = new Animated.Value(0);
  scaleValue2 = new Animated.Value(0);
  cardScale2 = this.scaleValue2.interpolate({
    inputRange: [0, 0.25, 0.5, 1],
    outputRange: [1, 1.1, 1.3, 1.2],
  });
  opacityScale = this.scaleValue2.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });
  rotateScale = this.scaleValue2.interpolate({
    inputRange: [0, 0.25, 0.5, 0.75, 1],
    outputRange: ["0deg", "30deg", "0deg", "-30deg", "0deg"],
  });
  transformStyle2 = { transform: [{ scale: this.cardScale2 }] };
  transformStyle = {
    transform: [{ scale: this.cardScale2 }, { rotate: this.rotateScale }],
    opacity: this.opacityScale,
  };
  flikr = (like) => {
    if (like || (!this.state.liked && !like)) this.like();
    this.scaleValue2.setValue(0);
    Animated.spring(this.scaleValue2, {
      toValue: 1,
      easing: Easing.linear,
      useNativeDriver: true,
    }).start();
    setTimeout(
      () =>
        Animated.spring(this.scaleValue2, {
          toValue: 0,
          duration: 100,
          easing: Easing.linear,
          useNativeDriver: true,
        }).start(),
      200
    );
  };
  render() {
    var liked = this.state?.liked;
    var likes = this.state?.likes;
    const { item, index, getStyle, scrollY } = this.props;
    var rndMedia = Math.floor(Math.random() * (item.media?.length - 1 - 0)) + 0;
    var medias = [];
    var media = item.media?.length > 0 ? item.media[rndMedia] : null;
    item.media?.map((m) => {
      if (m.mimetype.includes("video")) medias.push(m);
    });
    if (medias.length !== 0) {
      rndMedia = Math.floor(Math.random() * (medias.length - 1 - 0)) + 0;
      media = medias[rndMedia];
    }

    if (item.end || item.start) {
      return (
        <Animated.View
          style={
            item.end
              ? getStyle(index)
              : {
                  transform: [
                    {
                      translateY: scrollY.interpolate({
                        inputRange: [
                          index === 0
                            ? 0
                            : index - 1 === 0
                            ? Dimensions.get("screen").height
                            : index * Dimensions.get("screen").height,
                          index === 0
                            ? Dimensions.get("screen").height
                            : (index + 1) * Dimensions.get("screen").height,
                        ],
                        outputRange: [0, Dimensions.get("screen").height / 1.5],
                        extrapolate: "clamp",
                        useNativeDriver: true,
                      }),
                    },
                  ],
                }
          }>
          <Layout
            style={{
              height: Dimensions.get("screen").height,
              backgroundColor: "transparent",
              // paddingTop: StatusBar.currentHeight,
            }}>
            <SafeAreaView>
              <Layout
                style={{
                  width: Dimensions.get("screen").width,
                  height: item.start
                    ? Dimensions.get("screen").height / 2
                    : Dimensions.get("screen").height / 3,
                  justifyContent: "center",
                  alignItems: "center",
                  top: item.start
                    ? StatusBar.currentHeight + 50
                    : StatusBar.currentHeight,
                  backgroundColor: "transparent",
                }}>
                {item.end ? (
                  <>
                    <Icon
                      name="arrowhead-up-outline"
                      style={{ width: 40, height: 40, tintColor: "black" }}
                    />
                    <Text>That's All Here</Text>
                  </>
                ) : (
                  <Footer />
                )}
              </Layout>
            </SafeAreaView>
          </Layout>
        </Animated.View>
      );
    }
    return (
      <Animated.View style={getStyle(index)}>
        <Layout
          style={{
            height: Dimensions.get("screen").height,
            // paddingTop: StatusBar.currentHeight,
            backgroundColor: "#fff",
          }}>
          <SafeAreaView>
            <LinearGradient
              colors={["white", "transparent"]}
              style={{
                position: "absolute",
                left: 0,
                right: 0,
                top: StatusBar.currentHeight,
                height: 60,
                elevation: 1,
              }}
            />
            <Layout style={{ elevation: 2, backgroundColor: "transparent" }}>
              <Layout
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}>
                <Layout
                  style={{
                    flexDirection: "row",
                    padding: 5,
                    paddingLeft: 20,
                    alignItems: "flex-start",
                  }}>
                  <Layout style={{ borderWidth: 1, borderRadius: 13 }}>
                    <TouchableWithoutFeedback
                      onPress={() => {
                        this.props.setShortModal(
                          true,
                          "Profile",
                          this.props.item.user
                        );
                      }}>
                      <Image
                        style={{ width: 35, height: 35, borderRadius: 13 }}
                        source={{ uri: this.props.item.user.profile.image }}
                        resizeMode="cover"
                      />
                    </TouchableWithoutFeedback>
                  </Layout>
                  <Layout style={{ paddingHorizontal: 10, marginTop: -5 }}>
                    <Text
                      style={{ fontWeight: "bold", fontSize: 16 }}
                      onPress={() => {
                        this.props.setShortModal(
                          true,
                          "Profile",
                          this.props.item.user
                        );
                      }}>
                      {this.props.item.user.username}
                    </Text>
                    {this.props.item.location ? (
                      <Layout
                        style={{
                          flexDirection: "row",
                          justifyContent: "space-between",
                          alignItems: "flex-start",
                          width: Dimensions.get("screen").width - 80,
                        }}>
                        <Text
                          appearance="hint"
                          style={{
                            fontSize: 12,
                            width: Dimensions.get("screen").width / 2,
                          }}>
                          {this.props.item.location}
                        </Text>
                        <Text appearance="hint" style={{ fontSize: 12 }}>
                          {timeSince(new Date(this.props.item.date))}
                        </Text>
                      </Layout>
                    ) : (
                      <Text appearance="hint" style={{ fontSize: 12 }}>
                        {timeSince(new Date(this.props.item.date))}
                      </Text>
                    )}
                  </Layout>
                </Layout>
                <TouchableOpacity
                  onPress={() =>
                    this.props.setShortModal(true, "Options", {
                      mopic: this.props.item,
                      component: "postOptions",
                    })
                  }>
                  <Icon
                    name={"more-vertical-outline"}
                    style={{
                      width: 30,
                      height: 30,
                      tintColor: "#000",
                      marginRight: 5,
                    }}
                  />
                </TouchableOpacity>
              </Layout>
            </Layout>
            <Layout
              style={{
                backgroundColor: "transparent",
                height: Dimensions.get("screen").height,
                position: "absolute",
                top: StatusBar.currentHeight,
                left: 0,
                right: 0,
                bottom: 0,
                zIndex: -1,
              }}>
              {media?.mimetype.includes("video") ? (
                <Layout
                  key={index}
                  style={{
                    width: Dimensions.get("screen").width,
                    height: Dimensions.get("screen").height - 60,
                    justifyContent: "center",
                    alignItems: "center",
                  }}>
                  <PinchableBox
                    doubleTap={() => {
                      this.flikr();
                    }}
                    style={{
                      width: Dimensions.get("screen").width,
                      height: Dimensions.get("screen").height - 60,
                    }}
                    mediaType="video"
                    media={media}
                  />
                </Layout>
              ) : (
                <Layout
                  key={index}
                  style={{
                    width: Dimensions.get("screen").width,
                    height: Dimensions.get("screen").height - 60,
                    justifyContent: "center",
                    alignItems: "center",
                  }}>
                  <PinchableBox
                    style={{
                      width: Dimensions.get("screen").width,
                      height: Dimensions.get("screen").height - 60,
                    }}
                    doubleTap={() => {
                      this.flikr();
                    }}
                    media={media}
                  />
                </Layout>
              )}
            </Layout>
          </SafeAreaView>
          <Animated.View
            style={{
              ...this.transformStyle,
              position: "absolute",
              width: Dimensions.get("screen").width,
              height: Dimensions.get("screen").height,
              justifyContent: "center",
              alignItems: "center",
              top: StatusBar.currentHeight,
            }}>
            <Icon
              name="heart"
              style={{ width: 80, height: 80, tintColor: "red" }}
            />
            <Icon
              name="heart"
              style={{
                width: 83,
                height: 83,
                tintColor: "white",
                marginTop: -81.5,
                opacity: 0.5,
              }}
            />
          </Animated.View>
          <Layout
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              zIndex: 10,
              backgroundColor: "transparent",
              bottom: 0,
              elevation: 1,
            }}>
            <Layout
              style={{
                padding: 5,
                backgroundColor: "transparent",
                flexDirection: "row",
              }}>
              <Text
                numberOfLines={this.state.captionFull ? undefined : 2}
                onPress={() => {
                  this.setState({ captionFull: !this.state.captionFull });
                }}>
                {this.props.item.caption}
              </Text>
            </Layout>

            <Layout
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                paddingHorizontal: 15,
                marginBottom: 10,
                backgroundColor: "transparent",
              }}>
              <Layout
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  backgroundColor: "transparent",
                }}>
                <Layout
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    backgroundColor: "transparent",
                  }}>
                  <TouchableWithoutFeedback onPress={() => this.flikr(true)}>
                    <Animated.View style={this.transformStyle2}>
                      <Icon
                        name={liked ? "heart" : "heart-outline"}
                        style={{
                          width: 25,
                          height: 25,
                          tintColor: "red",
                          marginRight: 5,
                        }}
                      />
                    </Animated.View>
                  </TouchableWithoutFeedback>
                  <Text>{this.convertInt(likes)}</Text>
                </Layout>
                <Layout
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    marginLeft: 20,
                    backgroundColor: "transparent",
                  }}>
                  <Icon
                    name={
                      this.props.item.rating || this.state.selfRate
                        ? "star"
                        : "star-outline"
                    }
                    style={{
                      width: 25,
                      height: 25,
                      tintColor: "orange",
                      marginRight: 5,
                    }}
                  />
                  <Animated.View
                    style={{
                      position: "absolute",
                      opacity: this.ratingOpacity,
                    }}>
                    <Rating
                      type="custom"
                      ratingColor="orange"
                      showRating={false}
                      imageSize={25}
                      startingValue={0}
                      onStartRating={() => {
                        Animated.spring(this.ratingOpacity, {
                          toValue: 1,
                          useNativeDriver: false,
                        }).start();
                        Animated.spring(this.ratingTranslate, {
                          toValue: 110,
                          useNativeDriver: false,
                        }).start();
                      }}
                      onFinishRating={(value) => {
                        this.onRateChange(value);
                        Animated.spring(this.ratingOpacity, {
                          toValue: 0,
                          useNativeDriver: false,
                        }).start();

                        Animated.spring(this.ratingTranslate, {
                          toValue: 0,
                          useNativeDriver: false,
                        }).start();
                      }}
                    />
                  </Animated.View>
                  <Animated.View
                    style={{
                      transform: [{ translateX: this.ratingTranslate }],
                    }}>
                    <Text>
                      {this.state.rate.toString().includes(".")
                        ? this.state.rate
                        : this.state.rate + ".0"}
                    </Text>
                  </Animated.View>
                </Layout>

                <Animated.View
                  style={{
                    transform: [{ translateX: this.ratingTranslate }],
                    flexDirection: "row",
                    alignItems: "center",
                  }}>
                  <Layout
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      marginLeft: 20,
                      backgroundColor: "transparent",
                    }}>
                    <TouchableOpacity
                      onPress={() =>
                        this.props.navigation.navigate("CommentsScreen", {
                          mid: this.props.item.id,
                        })
                      }>
                      <Icon
                        name={"message-circle-outline"}
                        style={{
                          width: 25,
                          height: 25,
                          tintColor: "blue",
                          marginRight: 5,
                        }}
                      />
                    </TouchableOpacity>
                    <Text>{this.convertInt(this.props.item.comments)}</Text>
                  </Layout>
                  <Layout
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      marginLeft: 20,
                      backgroundColor: "transparent",
                    }}>
                    <Icon
                      name={"paper-plane-outline"}
                      style={{
                        width: 25,
                        height: 25,
                        tintColor: "#ff3d71",
                        marginRight: 5,
                      }}
                    />
                  </Layout>
                </Animated.View>
              </Layout>

              <Animated.View
                style={{
                  transform: [{ translateX: this.ratingTranslate }],
                }}>
                {this.state.user.accept ? (
                  <Button
                    onPress={() => this.follow(true)}
                    size="small"
                    style={{
                      padding: 0,
                      height: 10,
                      maxHeight: 10,
                    }}>
                    Accept
                  </Button>
                ) : this.state.user.requested ? (
                  <Button
                    size="small"
                    appearance="outline"
                    style={{
                      padding: 0,
                      height: 10,
                      maxHeight: 10,
                    }}>
                    Requested
                  </Button>
                ) : this.state.user.following !== null ? (
                  !this.state.user.following ? (
                    this.state.user.followback ? (
                      <Button
                        onPress={this.follow.bind(this)}
                        size="small"
                        style={{
                          padding: 0,
                          height: 10,
                          maxHeight: 10,
                        }}>
                        Follow Back
                      </Button>
                    ) : (
                      <Button
                        onPress={this.follow.bind(this)}
                        size="small"
                        style={{
                          padding: 0,
                          height: 10,
                          maxHeight: 10,
                        }}>
                        Follow
                      </Button>
                    )
                  ) : (
                    <Button
                      appearance="outline"
                      size="small"
                      style={{
                        padding: 0,
                        height: 10,
                        maxHeight: 10,
                      }}>
                      Following
                    </Button>
                  )
                ) : null}
              </Animated.View>
            </Layout>
          </Layout>
          <LinearGradient
            colors={["transparent", "#fff"]}
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              bottom: 0,
              height: 70,
            }}
          />
        </Layout>
      </Animated.View>
    );
  }
}
class MopicScreen extends Component {
  state = {
    scrollY: new Animated.Value(0),
    mopics: [],
    loading: true,
  };
  scrollOffset = 0;
  componentDidMount() {
    this.props.navigation.addListener("blur", () => {
      // changeNavigationBarColor("#ffffff", true);
      showNavigationBar(true);
    });

    this.props.navigation.addListener("focus", () => {
      // changeNavigationBarColor("transparent", true);
      hideNavigationBar(true);
    });
    if (this.props?.route?.params?.data) {
      this.setState({
        mopics: [
          { start: true },
          ...this.props?.route?.params?.data,
          { end: true },
        ],
        index: this.props?.route?.params?.index,
      });
    } else {
      this.props.navigation.goBack();
    }
  }
  onScrollEnd = (e) => {
    const { contentOffset, velocity } = e.nativeEvent;
    const y =
      contentOffset.y /
      (e.nativeEvent.contentSize.height / this.state.mopics.length);
    var screenHeight = Dimensions.get("screen").height;
    var moved = contentOffset.y - screenHeight;
    while (moved > screenHeight) {
      moved -= screenHeight;
    }
    if (contentOffset.y < this.scrollOffset) {
      moved -= screenHeight;
    }
    var newY = contentOffset.y - moved;
    if (moved < -100) {
      newY = contentOffset.y - moved - screenHeight;
    } else if (moved > 150) {
      newY = contentOffset.y - moved + screenHeight;
    } else {
      newY = contentOffset.y - moved;
    }
    if (
      contentOffset.y >
      e.nativeEvent.contentSize.height - screenHeight - screenHeight / 2
    ) {
      this.props.navigation.goBack();
    }
    if (contentOffset.y > e.nativeEvent.contentSize.height - screenHeight * 2) {
      newY = contentOffset.y - moved;
    }
    this.list.scrollToOffset({
      offset: newY,
    });
    this.scrollOffset = newY;
  };
  getStyle = (index) => {
    return {
      opacity: this.state.scrollY.interpolate({
        inputRange: [
          index === 0
            ? 0
            : index - 1 === 0
            ? Dimensions.get("screen").height
            : index * Dimensions.get("screen").height,
          index === 0
            ? Dimensions.get("screen").height
            : (index + 1) * Dimensions.get("screen").height,
        ],
        outputRange: [1, 0],
        extrapolate: "clamp",
        useNativeDriver: true,
      }),

      transform: [
        {
          translateY: this.state.scrollY.interpolate({
            inputRange: [
              index === 0
                ? 0
                : index - 1 === 0
                ? Dimensions.get("screen").height
                : index * Dimensions.get("screen").height,
              index === 0
                ? Dimensions.get("screen").height
                : (index + 1) * Dimensions.get("screen").height,
            ],
            outputRange: [0, Dimensions.get("screen").height / 2],
            extrapolate: "clamp",
            useNativeDriver: true,
          }),
        },
        {
          scale: this.state.scrollY.interpolate({
            inputRange: [
              index === 0
                ? 0
                : index - 1 === 0
                ? Dimensions.get("screen").height
                : index * Dimensions.get("screen").height,
              index === 0
                ? Dimensions.get("screen").height
                : (index + 1) * Dimensions.get("screen").height,
            ],
            outputRange: [1, 0],
            extrapolate: "clamp",
            useNativeDriver: true,
          }),
        },
      ],
    };
  };
  render() {
    return (
      <FlatList
        style={{ backgroundColor: "transparent" }}
        showsVerticalScrollIndicator={false}
        ref={(ref) => {
          this.list = ref;

          setTimeout(() => {
            var set = true;
            var count = 0;
            while (set) {
              try {
                this.scrollOffset = this.state?.index
                  ? Dimensions.get("screen").height * (this.state.index + 1)
                  : Dimensions.get("screen").height;
                this.list.scrollToOffset({
                  offset: this.scrollOffset,
                });
                set = false;
              } catch (e) {
                count++;
                set = count < 50;
              }
            }
          }, 50);
        }}
        onScroll={(e) => {
          Animated.event(
            [
              {
                nativeEvent: { contentOffset: { y: this.state.scrollY } },
              },
            ],
            { useNativeDriver: false }
          )(e);
        }}
        onScrollEndDrag={this.onScrollEnd}
        data={this.state.mopics}
        keyExtractor={(item, index) => index}
        renderItem={({ item, index }) => {
          return (
            <Mopic
              key={index}
              item={item}
              index={index}
              auth={this.props.auth}
              scrollY={this.state.scrollY}
              setShortModal={this.props.setShortModal}
              navigation={this.props.navigation}
              getStyle={this.getStyle.bind(this)}
            />
          );
        }}
      />
    );
  }
}

const mapStateToProps = (state) => ({
  ShortModal: state.main.ShortModal,
  auth: state.secure.auth,
});

export default connect(mapStateToProps, { setShortModal, setShortModalProps })(
  MopicScreen
);
