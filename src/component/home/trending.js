import React, { Component } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { Icon, Layout, Spinner, Text } from "@ui-kitten/components";
import { TouchableRipple } from "react-native-paper";
import { connect } from "react-redux";
import { setShortModal, setShortModalProps } from "../../actions/ShortModal";
import { Dimensions, RefreshControl, Image, Animated } from "react-native";
import {
  ScrollView,
  TouchableWithoutFeedback,
  LongPressGestureHandler,
  State,
} from "react-native-gesture-handler";
import * as Constants from "../Constants";

import { Easing } from "react-native-reanimated";
import VideoPlayerHome from "../utils/VideoPlayerHome";
function wait(timeout) {
  return new Promise((resolve) => {
    setTimeout(resolve, timeout);
  });
}
class TrendingObj extends Component {
  getRndMedia =
    Math.floor(Math.random() * (this.props.data.media.length - 1 - 0)) + 0;
  render() {
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
        onPress={() => {
          this.props.navigation(this.props.index);
        }}
        onPressIn={() => {
          scaleValue.setValue(0);
          Animated.timing(scaleValue, {
            toValue: 1,
            duration: 150,
            easing: Easing.linear,
            useNativeDriver: true,
          }).start();
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
              width: this.props.width,
              height: this.props.width,
              borderWidth: 1,
              borderColor: "white",
            }}>
            {this.props.data.media[this.getRndMedia]?.mimetype?.includes(
              "video"
            ) ? (
              <VideoPlayerHome
                ref={(ref) => (this.VideoPlayerHome = ref)}
                uri={this.props.data.media[this.getRndMedia]?.uri}
                thumbnail={this.props.data.media[this.getRndMedia]?.thumbnail}
                style={{
                  width: "100%",
                  height: "100%",
                }}
              />
            ) : (
              <Image
                source={{
                  uri: this.props.data.media[this.getRndMedia]?.uri,
                }}
                resizeMode="cover"
                style={{
                  width: "100%",
                  height: "100%",
                }}
              />
            )}
          </Layout>
          <Layout
            style={{
              position: "absolute",
              backgroundColor: "transparent",
              bottom: 0,
              right: 0,
              padding: 5,
            }}>
            <Text style={{ color: "white" }}>#{this.props.data.trending}</Text>
          </Layout>
        </Animated.View>
      </TouchableWithoutFeedback>
    );
  }
}
class Trending extends Component {
  width = Dimensions.get("window").width;
  state = {
    trends: null,
    loading: true,
    width: [1.5, 3, 3, 3, 3, 1.5, 3, 3, 3, 3],
  };
  componentDidMount() {
    this.fetchTrends();
  }
  fetchTrends() {
    fetch(Constants.API_URL + "/mopic/trends/", {
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
          var widths = [
            [1.5, 3, 3, 3, 3, 1.5, 3, 3, 3, 3],
            [1.5, 3, 3, 1.5, 3, 3, 3, 3, 3, 3],
            [1.5, 3, 3, 3, 3, 3, 3, 1.5, 3, 3],
            [1.5, 3, 3, 3, 3, 3, 3, 3, 3, 1.5],
            [3, 3, 1.5, 3, 3, 1.5, 3, 3, 3, 3],
            [3, 3, 1.5, 1.5, 3, 3, 3, 3, 3, 3],
            [3, 3, 3, 3, 1.5, 3, 3, 1.5, 3, 3],
            [3, 3, 3, 3, 3, 3, 1.5, 3, 3, 1.5],
          ];
          var width = widths[Math.floor(Math.random() * widths.length - 1 + 0)];
          if (data.trends.length === 1) {
            width = [1.5];
          } else if (data.trends.length === 2) {
            width = [1.5, 1.5];
          } else if (data.trends.length === 3) {
            width = [1.5, 3, 3];
          } else if (data.trends.length === 4) {
            width = [1.5, 3, 3, 1.5];
          } else if (data.trends.length === 5) {
            width = [3, 3, 1.5, 3, 3];
          } else if (data.trends.length === 6) {
            width = [1.5, 3, 3, 1.5, 3, 3];
          } else if (data.trends.length === 7) {
            width = [1.5, 3, 3, 1.5, 3, 3, 1.5];
          } else if (data.trends.length === 8) {
            width = [1.5, 3, 3, 3, 3, 1.5, 3, 3];
          } else if (data.trends.length === 9) {
            width = [1.5, 3, 3, 1.5, 3, 3, 1.5, 3, 3];
          }
          if (data.trends.length === 0) {
            this.props.hideTrends();
          }
          this.props.hashTrends(data.hash);
          this.setState({
            trends: data.trends,
            loading: false,
            width,
          });
        } else {
          this.setState({ loading: false });
        }
      })
      .catch(() => {
        this.setState({ loading: false });
      });
  }

  render() {
    const { width } = this.state;
    return (
      <>
        {this.state.loading ? (
          <Layout
            style={{
              width: this.width,
              height: this.width / 1.5,
              justifyContent: "center",
              alignItems: "center",
            }}>
            <Spinner />
          </Layout>
        ) : (
          this.state.trends?.map((trend, index) => {
            if (width.length > index)
              if (width[index] === 3 && width[index + 1] === 3) {
                return (
                  <Layout
                    key={index}
                    style={{ flexWrap: "wrap", flexDirection: "column" }}>
                    <TrendingObj
                      index={index}
                      data={trend}
                      navigation={(index) =>
                        this.props.navigation.navigate("MopicScreen", {
                          data: this.state.trends,
                          index,
                        })
                      }
                      width={this.width / 3}
                    />
                    <TrendingObj
                      index={index + 1}
                      data={this.state?.trends[index + 1]}
                      navigation={(index) =>
                        this.props.navigation.navigate("MopicScreen", {
                          data: this.state.trends,
                          index,
                        })
                      }
                      width={this.width / 3}
                    />
                  </Layout>
                );
              } else if (width[index] === 1.5) {
                return (
                  <TrendingObj
                    key={index}
                    data={trend}
                    index={index}
                    navigation={(index) =>
                      this.props.navigation.navigate("MopicScreen", {
                        data: this.state.trends,
                        index,
                      })
                    }
                    width={this.width / 1.5}
                  />
                );
              }
          })
        )}
      </>
    );
  }
}
const mapStateToProps = (state) => ({
  ShortModal: state.main.ShortModal,
  auth: state.secure.auth,
});

export default connect(mapStateToProps, { setShortModal, setShortModalProps })(
  Trending
);
