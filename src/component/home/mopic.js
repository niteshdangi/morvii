import React from "react";
import { Layout } from "@ui-kitten/components";
import { connect } from "react-redux";
import StoryView from "./stories";
import { Text, Icon } from "@ui-kitten/components";
import { View, Image, Animated, Dimensions } from "react-native";
import {
  TouchableWithoutFeedback,
  TouchableOpacity,
} from "react-native-gesture-handler";
import ParsedText from "react-native-parsed-text";
import { Easing } from "react-native-reanimated";
import styled from "styled-components";
import * as Constants from "../Constants";
import { Video } from "expo-av";
import VideoPlayerHome from "../utils/VideoPlayerHome";
import timeSince from "../utils/TimeSince";
import FlexImage from "react-native-flex-image";
import HomeMedia from "./HomeMedia";
import { Rating } from "react-native-ratings";
import Ripple from "react-native-material-ripple";
import { setMopics } from "../../actions/HomeActions";

class Mopic extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      captionFull: false,
      selfRate: false,
      data: this.props?.data,
    };
  }

  getRndMedia =
    Math.floor(Math.random() * (this.state?.data.media.length - 1 - 0)) + 0;
  ratingOpacity = new Animated.Value(0);
  ratingTranslate = new Animated.Value(0);
  convertInt(int) {
    return int
      ? int < 1000
        ? int
        : int < 1000000
        ? Math.round(int / 1000) + "K"
        : Math.round(int / 1000000) + "M"
      : 0;
  }
  pauseVideo() {
    this?.VideoPlayerHome?.pauseVideo();
  }
  componentDidUpdate() {
    if (this.props.data.id !== this.state.data.id) {
      this.setState({ data: this.props.data });
    }
  }
  componentDidMount() {
    if (this.state?.data.refresh) {
      fetch(Constants.API_URL + "/mopic/" + this.state?.data?.id + "/", {
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
              data: data,
            });
            if (data != this.props.data) {
              this.props.setMopics([
                ...this.props.mopics.map((item, index) =>
                  item.id === data.id ? data : item
                ),
              ]);
              console.log(true);
            }
          } else {
          }
        })
        .catch(() => {});
    }
    // setInterval(() => {
    //   fetch(Constants.API_URL + "/mopic/" + this.state?.data?.id + "/", {
    //     method: "POST",
    //     headers: {
    //       Accept: "application/json",
    //       Authorization: "Token " + this.props.auth.token,
    //       "Content-Type": "application/json",
    //     },
    //   })
    //     .then((response) => {
    //       const statusCode = response.status;
    //       const data = response.json();
    //       return Promise.all([statusCode, data]);
    //     })
    //     .then(([statusCode, data]) => {
    //       if (statusCode === 200) {
    //         this.setState({
    //           data: data,
    //         });
    //         if (data != this.props.data) {
    //           this.props.setMopics([
    //             ...this.props.mopics.map((item, index) =>
    //               item.id === data.id ? data : item
    //             ),
    //           ]);
    //           console.log(true);
    //         }
    //       } else {
    //       }
    //     })
    //     .catch(() => {});
    // }, 300000);
  }
  like() {
    this.setState({
      data: { ...this.state.data, liked: !this.state?.data.liked },
    });
    fetch(Constants.API_URL + "/mopic/" + this.state?.data?.id + "/like/", {
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
            data: {
              ...this.state.data,

              liked: data.liked,
              likes: data.likes,
            },
          });
          this.props.setMopics([
            ...this.props.mopics.map((item, index) =>
              item.id === data.id
                ? {
                    ...this.state.data,

                    liked: data.liked,
                    likes: data.likes,
                  }
                : item
            ),
          ]);
        } else {
          this.setState({
            data: { ...this.state.data, liked: !this.state?.data.liked },
          });
        }
      })
      .catch(() => {
        this.setState({
          data: { ...this.state.data, liked: !this.state?.data.liked },
        });
      });
  }
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
    if (like || (!this.state?.data.liked && !like)) this.like();
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
  onRateChange(value) {
    this.setState({ selfRate: true });
    fetch(Constants.API_URL + "/mopic/" + this.state?.data?.id + "/rate/", {
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
        this.setState({
          data: { ...this.state.data, rate: data.rate },
        });
        this.props.setMopics([
          ...this.props.mopics.map((item, index) =>
            item.id === data.id ? { ...this.state.data, rate: data.rate } : item
          ),
        ]);
      })
      .catch(() => {});
  }
  render() {
    var liked = this.state?.data.liked;
    var likes = this.state?.data.likes;
    return (
      <Layout
        style={{ marginVertical: 10, width: Dimensions.get("screen").width }}>
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
                this.props.onOptionPress("Profile", this.state?.data.user);
              }}>
              <Image
                style={{ width: 35, height: 35, borderRadius: 13 }}
                source={{ uri: this.state?.data?.user?.profile.image }}
                resizeMode="cover"
              />
            </TouchableWithoutFeedback>
          </Layout>
          <Layout style={{ paddingHorizontal: 10, marginTop: -5 }}>
            <Text
              style={{ fontWeight: "bold", fontSize: 16 }}
              onPress={() => {
                this.props.onOptionPress("Profile", this.state?.data.user);
              }}>
              {this.state?.data?.user?.username}
            </Text>
            {this.state?.data.location ? (
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
                  {this.state?.data.location}
                </Text>
                <Text appearance="hint" style={{ fontSize: 12 }}>
                  {timeSince(new Date(this.state?.data.date)) + ""}
                </Text>
              </Layout>
            ) : (
              <Text appearance="hint" style={{ fontSize: 12 }}>
                {timeSince(new Date(this.state?.data.date)) + ""}
              </Text>
            )}
          </Layout>
        </Layout>
        <Layout>
          <HomeMedia
            navigation={this.props.navigation}
            data={this.state?.data.media}
            onLike={this.flikr.bind(this)}
          />
          {this.state.data.user.username === this.props.auth.user.username &&
          !this.props.auth.user.profile.private ? (
            <Ripple
              style={{
                position: "absolute",
                left: 10,
                margin: 15,
                padding: 5,
                elevation: 5,
                borderRadius: 20,
                paddingHorizontal: 15,
                backgroundColor: "rgba(255,255,255,0.9)",
                zIndex: 10,
              }}>
              <Text>Promote Mopic</Text>
            </Ripple>
          ) : null}
          {/* <Animated.View
            style={{
              ...this.transformStyle,
              position: "absolute",
              justifyContent: "center",
              alignItems: "center",
              width: "100%",
              height: "100%",
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
          </Animated.View> */}
        </Layout>
        <Layout
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            paddingHorizontal: 15,
          }}>
          <Layout
            style={{
              flexDirection: "row",
              alignItems: "center",
            }}>
            <Layout
              style={{
                flexDirection: "row",
                alignItems: "center",
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
              <Ripple
                style={{ paddingRight: 20 }}
                onPress={() => {
                  this.props.navigation.navigate("UserListScreen", {
                    header: "Likes",
                    data: (self) => {
                      self.setState({ auth: this.props.auth });
                      fetch(
                        Constants.API_URL +
                          "/mopic/likes/" +
                          this.state?.data?.id +
                          "/",
                        {
                          method: "POST",
                          headers: {
                            Accept: "application/json",
                            Authorization: "Token " + this.props.auth.token,
                            "Content-Type": "application/json",
                          },
                        }
                      )
                        .then((response) => {
                          const statusCode = response.status;
                          const data = response.json();
                          return Promise.all([statusCode, data]);
                        })
                        .then(([statusCode, data]) => {
                          self.setState({
                            data: data.data,
                            loading: false,
                          });
                        })
                        .catch(() => {
                          self.setState({ loading: false });
                        });
                    },
                  });
                }}>
                <Text>{this.convertInt(likes)}</Text>
              </Ripple>
            </Layout>
            <Layout
              style={{
                flexDirection: "row",
                alignItems: "center",
              }}>
              <Icon
                name={
                  this.state?.data.rating || this.state.selfRate
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
                  // ratingImage={require("../../../assets/Images/star.png")}
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
                style={{ transform: [{ translateX: this.ratingTranslate }] }}>
                <Ripple
                  style={{ paddingRight: 20 }}
                  onPress={() => {
                    if (
                      this.state.data.user.profile.ratingView ||
                      this.state.data.user.username ===
                        this.props.auth.user.username
                    )
                      this.props.navigation.navigate("UserListScreen", {
                        header: "Ratings",
                        data: (self) => {
                          self.setState({ auth: this.props.auth });
                          fetch(
                            Constants.API_URL +
                              "/mopic/ratings/" +
                              this.state?.data?.id +
                              "/",
                            {
                              method: "POST",
                              headers: {
                                Accept: "application/json",
                                Authorization: "Token " + this.props.auth.token,
                                "Content-Type": "application/json",
                              },
                            }
                          )
                            .then((response) => {
                              const statusCode = response.status;
                              const data = response.json();
                              return Promise.all([statusCode, data]);
                            })
                            .then(([statusCode, data]) => {
                              self.setState({
                                ratings: data.data,
                                loading: false,
                              });
                            })
                            .catch(() => {
                              self.setState({ loading: false });
                            });
                        },
                      });
                  }}>
                  <Text>
                    {this.state?.data.rate.toString().includes(".")
                      ? this.state?.data.rate
                      : this.state?.data.rate + ".0"}
                  </Text>
                </Ripple>
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
                }}>
                <TouchableOpacity
                  onPress={() =>
                    this.props.navigation.navigate("CommentsScreen", {
                      mid: this.state?.data.id,
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
                <Text>{this.convertInt(this.state?.data.comments)}</Text>
              </Layout>
              <Layout
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  marginLeft: 20,
                }}>
                <TouchableOpacity
                  onPress={() => {
                    this.props.messageShare();
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
                </TouchableOpacity>
              </Layout>
            </Animated.View>
          </Layout>

          <Animated.View
            style={{ transform: [{ translateX: this.ratingTranslate }] }}>
            <TouchableOpacity
              onPress={() =>
                this.props.onOptionPress("Options", {
                  mopic: this.state?.data,
                  component: "postOptions",
                })
              }>
              <Icon
                name={"more-horizontal-outline"}
                style={{
                  width: 30,
                  height: 30,
                  tintColor: "#000",
                  marginRight: 5,
                }}
              />
            </TouchableOpacity>
          </Animated.View>
        </Layout>
        <Layout style={{ paddingHorizontal: 15, paddingTop: 10 }}>
          <ParsedText
            parse={[
              { pattern: /#(\w+)/, style: { color: "blue" } },
              {
                pattern: /@(\w+)/,
                style: { color: "blue" },
                onPress: (text) => {
                  this.props.navigation.navigate("ProfileScreen", {
                    username: text.replace("@", ""),
                  });
                },
              },
            ]}
            numberOfLines={this.state.captionFull ? undefined : 2}
            onPress={() => {
              this.setState({ captionFull: !this.state.captionFull });
            }}
            onLongPress={() => {
              this.setState({ captionFull: !this.state.captionFull });
            }}>
            {this.state?.data.caption}
          </ParsedText>
        </Layout>
      </Layout>
    );
  }
}
const MoreIB = styled.View`
  position: absolute;
  bottom: 0;
  right: 0;
`;
const mapStateToProps = (state) => ({
  auth: state.secure.auth,
  mopics: state.main.HomeReducer.mopics,
});

export default connect(mapStateToProps, { setMopics })(Mopic);
