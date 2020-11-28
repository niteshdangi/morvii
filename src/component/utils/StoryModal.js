import React, { Component } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { setShortModal, setShortModalProps } from "../../actions/ShortModal";
import { connect } from "react-redux";
import * as Progress from "react-native-progress";
import {
  StatusBar,
  Dimensions,
  Image,
  Animated,
  View,
  PanResponder,
  Keyboard,
} from "react-native";
import { Layout, Text, Button, Icon, Input } from "@ui-kitten/components";
import StoryView from "../home/stories";
import StoryMopic from "./StoryMopic";
import {
  TouchableWithoutFeedback,
  FlatList,
  State,
} from "react-native-gesture-handler";
import changeNavigationBarColor from "react-native-navigation-bar-color";

import { LinearGradient } from "expo-linear-gradient";
import { Easing } from "react-native-reanimated";
import DoubleClick from "react-native-double-tap";
import { ProgressBar } from "react-native-paper";
import * as Constants from "../Constants";
import InViewPort from "./InViewport";
const screenHeight = Dimensions.get("window").height * 1.2;

class StoryModal extends Component {
  componentDidMount() {
    // StatusBar.setBarStyle("dark-content", true);
    this.getStory(this.state.stories[this.state.index]?.user.username);
    changeNavigationBarColor("#000000", true);
  }
  state = {
    scrollY: new Animated.Value(0),
    story: [],
    loading: true,
    stories: this.props.ShortModal.props.story,
    index: this.props.ShortModal.props.index,
  };
  closeModal = () => {
    this.props.setShortModal(false, "Loading");
    changeNavigationBarColor("#ffffff", true);
  };
  pan = new Animated.Value(0);
  scale = new Animated.Value(1);
  nextPan = new Animated.Value(0);
  currentPan = new Animated.Value(0);
  prevPan = new Animated.Value(0);
  getStory(username) {
    fetch(Constants.API_URL + "/story/" + username + "/", {
      method: "GET",
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
        // if (data.story.length === 0) this.props?.nextStory();
        this.setState({ story: data.story, loading: false });
      })
      .catch(() => {
        if (this.state.index < this.state.stories.length - 1) {
          this.getStory(
            this.state.stories[this.state.index + 1]?.user.username
          );
          this.setState({ index: this.state.index + 1 });
        } else this.closeModal();
      });
  }
  next = () => {
    if (this.state.index < this.state.stories.length - 1) {
      this.getStory(this.state.stories[this.state.index + 1]?.user.username);
      this.setState({ index: this.state.index + 1 });
    } else this.closeModal();
  };
  prev = () => {
    if (this.state.index > 0) {
      this.getStory(this.state.stories[this.state.index - 1]?.user.username);
      this.setState({ index: this.state.index - 1 });
    } else {
    }
  };
  render() {
    return (
      <Animated.View
        style={{
          transform: [{ translateY: this.pan }, { scale: this.scale }],
          flex: 1,
        }}>
        {this.state.index > 0 ? (
          <Animated.View
            style={{
              flex: 1,
              justifyContent: "center",
              alignItems: "center",
              backgroundColor: "rgba(0,0,0,0.9)",
              width: Dimensions.get("screen").width,
              position: "absolute",
              left: -Dimensions.get("screen").width,
              top: StatusBar.currentHeight,
              transform: [
                {
                  translateX: this.prevPan.interpolate({
                    inputRange: [0, Dimensions.get("screen").width],
                    outputRange: [0, Dimensions.get("screen").width],
                  }),
                },
                {
                  scale: this.prevPan.interpolate({
                    inputRange: [0, Dimensions.get("screen").width],
                    outputRange: [0.7, 1],
                  }),
                },
              ],
              height: "100%",
              borderRadius: 10,
            }}>
            <StoryView
              size={100}
              image={
                this.state.stories[this.state.index - 1]?.user.profile.image
              }
            />
          </Animated.View>
        ) : null}
        <Animated.View
          style={{
            flex: 1,
            transform: [
              {
                translateX: this.currentPan.interpolate({
                  inputRange: [-Dimensions.get("screen").width, 0],
                  outputRange: [-Dimensions.get("screen").width, 0],
                }),
              },
              {
                scale: this.currentPan.interpolate({
                  inputRange: [
                    -Dimensions.get("screen").width,
                    0,
                    Dimensions.get("screen").width,
                  ],
                  outputRange: [0.8, 1, 0.8],
                }),
              },
            ],
          }}>
          <StoryMopic
            item={this.state.stories[this.state.index]}
            loading={this.state.loading}
            story={this.state.story}
            index={this.state.index}
            next={() => this.next()}
            prev={() => this.prev()}
            navigation={this.props.navigation}
            close={this.closeModal}
            delete={() => {
              this.getStory(
                this.state.stories[this.state.index]?.user.username
              );
            }}
            token={this.props.auth.token}
            self={
              this.state.stories[this.state.index].user.username ===
              this.props.auth.user.username
            }
            PanResponderY={(e) => {
              const dy = e.nativeEvent.translationY;
              Animated.timing(this.pan, {
                toValue: dy > 0 ? dy / 2 : dy / 1.2,
                duration: 0,
                useNativeDriver: false,
              }).start();
              var scaleValue = dy / screenHeight;
              Animated.timing(this.scale, {
                toValue: dy > 0 ? 1 - dy / screenHeight : 1 - dy / screenHeight,
                duration: 0,
                useNativeDriver: false,
              }).start();
              Animated.timing(this.prevPan, {
                toValue: -Dimensions.get("screen").width,
                duration: 0,
                useNativeDriver: true,
              }).start();
              Animated.timing(this.nextPan, {
                toValue: Dimensions.get("screen").width,
                duration: 0,
                useNativeDriver: true,
              }).start();
            }}
            PanResponderX={(e) => {
              const dx = e.nativeEvent.translationX;

              Animated.timing(this.prevPan, {
                toValue: dx,
                duration: 0,
                useNativeDriver: true,
              }).start();
              Animated.timing(this.currentPan, {
                toValue:
                  (this.state.index === 0 && dx > 0) ||
                  (this.state.index === this.state.stories.length - 1 && dx < 0)
                    ? dx * 0.2
                    : dx,
                duration: 0,
                useNativeDriver: true,
              }).start();
              Animated.timing(this.nextPan, {
                toValue: dx,
                duration: 0,
                useNativeDriver: true,
              }).start();
            }}
            onHandlerStateChangeY={(e) => {
              const dy = e.nativeEvent.translationY;
              if (dy >= 0.2 * screenHeight) {
                Animated.timing(this.pan, {
                  toValue:
                    dy > 0
                      ? screenHeight
                      : -(Dimensions.get("window").height / 2 - 50),
                  duration: 100,
                  useNativeDriver: false,
                }).start();
                setTimeout(() => this.closeModal(), 50);
              } else {
                Animated.spring(this.pan, {
                  toValue: 0,
                  bounciness: 10,
                  useNativeDriver: false,
                }).start();

                Animated.spring(this.scale, {
                  toValue: 1,
                  bounciness: 10,
                  useNativeDriver: false,
                }).start();
              }
            }}
            onHandlerStateChangeX={(e) => {
              const dx = e.nativeEvent.translationX;
              const vx = e.nativeEvent.velocityX;
              // console.log(dx, ":", );
              if (e.nativeEvent.state === State.END) {
                if (
                  ((dx > 130 && vx > 1) || vx > 1000) &&
                  this.state.index > 0
                ) {
                  Animated.spring(this.prevPan, {
                    toValue: Dimensions.get("screen").width,
                    duration: 0,
                    useNativeDriver: true,
                  }).start();
                  Animated.spring(this.currentPan, {
                    toValue: Dimensions.get("screen").width,
                    duration: 0,
                    useNativeDriver: true,
                  }).start();
                  Animated.spring(this.nextPan, {
                    toValue: 0,
                    duration: 0,
                    useNativeDriver: true,
                  }).start();
                  setTimeout(() => {
                    this.prev();
                    Animated.timing(this.prevPan, {
                      toValue: 0,
                      duration: 0,
                      useNativeDriver: true,
                    }).start();
                    Animated.timing(this.currentPan, {
                      toValue: 0,
                      duration: 0,
                      useNativeDriver: true,
                    }).start();
                    Animated.timing(this.nextPan, {
                      toValue: 0,
                      duration: 0,
                      useNativeDriver: true,
                    }).start();
                  }, 1000);
                } else if ((dx < -130 && vx < -1) || vx < -1000) {
                  Animated.spring(this.prevPan, {
                    toValue: 0,
                    duration: 0,
                    useNativeDriver: true,
                  }).start();
                  Animated.spring(this.currentPan, {
                    toValue: -Dimensions.get("screen").width,
                    duration: 0,
                    useNativeDriver: true,
                  }).start();
                  Animated.spring(this.nextPan, {
                    toValue: -Dimensions.get("screen").width,
                    duration: 0,
                    useNativeDriver: true,
                  }).start();
                  setTimeout(() => {
                    this.next();
                    Animated.timing(this.prevPan, {
                      toValue: 0,
                      duration: 0,
                      useNativeDriver: true,
                    }).start();
                    Animated.timing(this.currentPan, {
                      toValue: 0,
                      duration: 0,
                      useNativeDriver: true,
                    }).start();
                    Animated.timing(this.nextPan, {
                      toValue: 0,
                      duration: 0,
                      useNativeDriver: true,
                    }).start();
                  }, 1000);
                } else {
                  Animated.spring(this.prevPan, {
                    toValue: 0,
                    duration: 0,
                    useNativeDriver: true,
                  }).start();
                  Animated.spring(this.currentPan, {
                    toValue: 0,
                    duration: 0,
                    useNativeDriver: true,
                  }).start();
                  Animated.spring(this.nextPan, {
                    toValue: 0,
                    duration: 0,
                    useNativeDriver: true,
                  }).start();
                }
              }
            }}
          />
        </Animated.View>
        {this.state.index < this.state.stories.length - 1 ? (
          <Animated.View
            style={{
              flex: 1,
              justifyContent: "center",
              alignItems: "center",
              backgroundColor: "rgba(0,0,0,0.9)",
              width: Dimensions.get("screen").width,
              position: "absolute",
              right: 0,
              top: StatusBar.currentHeight,
              height: "100%",
              transform: [
                {
                  translateX: this.nextPan.interpolate({
                    inputRange: [-Dimensions.get("screen").width, 0],
                    outputRange: [0, Dimensions.get("screen").width],
                  }),
                },
                {
                  scale: this.nextPan.interpolate({
                    inputRange: [-Dimensions.get("screen").width, 0],
                    outputRange: [1, 0.7],
                  }),
                },
              ],
              borderRadius: 10,
            }}>
            <StoryView
              size={100}
              image={
                this.state.stories[this.state.index + 1]?.user.profile.image
              }
            />
          </Animated.View>
        ) : null}
      </Animated.View>
    );
  }
}

const mapStateToProps = (state) => ({
  ShortModal: state.main.ShortModal,
  auth: state.secure.auth,
});

export default connect(mapStateToProps, { setShortModal, setShortModalProps })(
  StoryModal
);
