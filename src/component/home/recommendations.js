import React, { Component } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { Icon, Layout, Text } from "@ui-kitten/components";
import { TouchableRipple } from "react-native-paper";
import { connect } from "react-redux";
import * as Constants from "../Constants";
import { setShortModal, setShortModalProps } from "../../actions/ShortModal";
import { Dimensions, RefreshControl, Image, Animated } from "react-native";
import {
  ScrollView,
  TouchableWithoutFeedback,
  LongPressGestureHandler,
  State,
} from "react-native-gesture-handler";
import { Easing } from "react-native-reanimated";
import { Rating } from "react-native-ratings";
import { Video } from "expo-av";
import VideoPlayerHome from "../utils/VideoPlayerHome";
import Ripple from "react-native-material-ripple";

function wait(timeout) {
  return new Promise((resolve) => {
    setTimeout(resolve, timeout);
  });
}
export class RecommendationObj extends Component {
  state = {
    liked: this.props?.item?.liked,
    selfRate: false,
  };
  ratingOpacity = new Animated.Value(0);
  ratingTranslate = new Animated.Value(0);
  like() {
    this.setState({
      liked: !this.state.liked,
    });
    fetch(Constants.API_URL + "/mopic/" + this.props?.item?.id + "/like/", {
      method: "POST",
      headers: {
        Accept: "application/json",
        Authorization: "Token " + this.props.token,
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
  onRateChange(value) {
    this.setState({ selfRate: true });
    fetch(Constants.API_URL + "/mopic/" + this.props?.item?.id + "/rate/", {
      method: "POST",
      headers: {
        Accept: "application/json",
        Authorization: "Token " + this.props.token,
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
  render() {
    var liked = this.state?.liked;
    let scaleValue = new Animated.Value(0);
    const cardScale = scaleValue.interpolate({
      inputRange: [0, 0.5, 1],
      outputRange: [1, 0.98, 0.95],
    });
    let transformStyle = {
      transform: [{ scale: cardScale }],
    };
    return (
      <TouchableWithoutFeedback
        style={{ width: "100%" }}
        onPressIn={() => {
          scaleValue.setValue(0);
          Animated.timing(scaleValue, {
            toValue: 1,
            duration: 150,
            easing: Easing.linear,
            useNativeDriver: true,
          }).start();
        }}
        onPress={() => {
          this.props.navigation.navigate("RecommendedMopics", {
            mopic: this.props?.item,
          });
        }}
        onPressOut={() => {
          Animated.timing(scaleValue, {
            toValue: 0,
            duration: 100,
            easing: Easing.linear,
            useNativeDriver: true,
          }).start();
        }}>
        <Animated.View style={transformStyle}>
          <Layout
            style={{
              width: this.props.width
                ? this.props.width
                : Dimensions.get("screen").width / 2 - 5,
              height: this.props.width
                ? this.props.width + 50
                : this.props.smaller
                ? Dimensions.get("screen").width / 2
                : Dimensions.get("screen").width / 2 + 50,
              borderWidth: 1,
              borderColor: "white",
              borderRadius: 10,
              overflow: "hidden",
              elevation: 2,
              margin: 2.5,
              marginBottom: 5,
            }}>
            <Layout style={{ elevation: 2, borderRadius: 10 }}>
              {this.props?.item?.media[0].mimetype.includes("video") ? (
                <VideoPlayerHome
                  source={{ uri: this.props?.item?.media[0].uri }}
                  shouldPlay={true}
                  isMuted
                  isLooping
                  resizeMode="cover"
                  thumbnail={this.props?.item?.media[0]?.thumbnail}
                  style={{
                    width: "100%",
                    height: this.props.width
                      ? this.props.width
                      : this.props.smaller
                      ? Dimensions.get("screen").width / 2 - 50
                      : Dimensions.get("screen").width / 2,
                    borderRadius: 10,
                  }}
                />
              ) : (
                <Image
                  source={{ uri: this.props?.item?.media[0].uri }}
                  resizeMode="cover"
                  style={{
                    width: "100%",
                    height: this.props.width
                      ? this.props.width
                      : this.props.smaller
                      ? Dimensions.get("screen").width / 2 - 50
                      : Dimensions.get("screen").width / 2,
                    borderRadius: 10,
                  }}
                />
              )}
            </Layout>
            <Layout
              style={{
                height: 50,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                paddingHorizontal: 5,
              }}>
              <Layout
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                }}>
                <Icon
                  name={
                    this.state.selfRate || this.props.item?.rating
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
                        toValue: 100,
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
                    flexDirection: "row",
                    alignItems: "center",
                  }}>
                  <Ripple onPress={() => this.flikr(true)}>
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
                  </Ripple>
                  <Icon
                    name={"paper-plane-outline"}
                    style={{
                      width: 25,
                      height: 25,
                      tintColor: "#ff3d71",
                      marginRight: 5,
                    }}
                  />
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
                    borderWidth: 1,
                    borderColor: "#222",
                    borderRadius: 10,
                  }}>
                  <Image
                    source={{ uri: this.props?.item?.user?.profile?.image }}
                    style={{ width: 30, height: 30, borderRadius: 10 }}
                  />
                </Layout>
              </Animated.View>
            </Layout>
          </Layout>
        </Animated.View>
      </TouchableWithoutFeedback>
    );
  }
}
class Recommendations extends Component {
  width = Dimensions.get("window").width;
  state = { mopics: [] };
  componentDidMount() {
    fetch(Constants.API_URL + "/mopic/recommendations/", {
      method: "POST",
      headers: {
        Accept: "application/json",
        Authorization: "Token " + this.props.token,
        "Content-Type": "application/json",
      },
    })
      .then((response) => {
        const statusCode = response.status;
        const data = response.json();
        return Promise.all([statusCode, data]);
      })
      .then(([statusCode, data]) => {
        this.setState({
          mopics: data.data,
          loading: false,
        });
      })
      .catch(() => {
        this.setState({ loading: false });
      });
  }
  render() {
    const smaller = Math.random() > 0.5;

    const data = this.state.mopics;
    const data1 = data.slice(2, (data.length + 2) / 2);
    const data2 = data.slice(
      (data.length + 2) / 2,
      data.length % 2 === 0 ? data.length : data.length - 1
    );

    return (
      <Layout style={{ minHeight: Dimensions.get("window").height - 100 }}>
        <Layout
          style={{ flexDirection: "row", backgroundColor: "transparent" }}>
          {data.length > 1 ? (
            <>
              <RecommendationObj
                item={data[0]}
                navigation={this.props.navigation}
                smaller={smaller}
                token={this.props.token}
              />
              <RecommendationObj
                item={data[1]}
                navigation={this.props.navigation}
                smaller={!smaller}
                token={this.props.token}
              />
            </>
          ) : data.length > 0 ? (
            <RecommendationObj
              item={data[0]}
              navigation={this.props.navigation}
              smaller={!smaller}
              token={this.props.token}
              width={Dimensions.get("screen").width - 10}
            />
          ) : null}
        </Layout>
        <Layout
          style={{ flexDirection: "row", backgroundColor: "transparent" }}>
          <Layout style={smaller ? { marginTop: -50 } : {}}>
            {data1.map((item, index) => {
              return (
                <RecommendationObj
                  item={item}
                  key={index}
                  navigation={this.props.navigation}
                  smallerShift={smaller ? index % 2 === 0 : index % 2 !== 0}
                  smaller={!smaller && index === data2.length - 1}
                  token={this.props.token}
                />
              );
            })}
          </Layout>
          <Layout style={!smaller ? { marginTop: -50 } : {}}>
            {data2.map((item, index) => {
              return (
                <RecommendationObj
                  item={item}
                  key={index}
                  navigation={this.props.navigation}
                  smallerShift={smaller ? index % 2 === 0 : index % 2 !== 0}
                  smaller={smaller && index === data2.length - 1}
                  token={this.props.token}
                />
              );
            })}
          </Layout>
          {data.length % 2 !== 0 && data.length > 1 && (
            <>
              <Layout
                style={{
                  justifyContent: "center",
                  alignItems: "center",
                  marginTop: smaller ? -50 : 0,
                  width: "50%",
                }}>
                {smaller && (
                  <RecommendationObj
                    item={{ ...data[data.length - 1] }}
                    navigation={this.props.navigation}
                    token={this.props.token}
                    smaller={true}
                  />
                )}
              </Layout>
              <Layout
                style={{
                  justifyContent: "center",
                  alignItems: "center",
                  marginTop: !smaller ? -50 : 0,
                }}>
                {!smaller && (
                  <RecommendationObj
                    item={{ ...data[data.length - 1] }}
                    navigation={this.props.navigation}
                    token={this.props.token}
                    smaller={true}
                  />
                )}
              </Layout>
            </>
          )}
        </Layout>
      </Layout>
    );
  }
}

const mapStateToProps = (state) => ({
  ShortModal: state.main.ShortModal,
  HomeBasic: state.main.HomeReducer,
  token: state.secure.auth.token,
});

export default connect(mapStateToProps, { setShortModal, setShortModalProps })(
  Recommendations
);
