import React from "react";
import { FlatList, View, Dimensions, Animated } from "react-native";
import { Spinner, Layout, Text, Icon } from "@ui-kitten/components";
import LottieView from "lottie-react-native";
import { Easing } from "react-native-reanimated";
import { ScrollView, PanGestureHandler } from "react-native-gesture-handler";
function wait(timeout) {
  return new Promise((resolve) => {
    setTimeout(resolve, timeout);
  });
}
class ScrollRefreshView extends React.Component {
  state = {
    refreshing: false,
    refreshEnabled: true,
    animProgress: new Animated.Value(0),
    scrollY: new Animated.Value(0),
  };
  componentDidMount() {
    this.state.scrollY.addListener(({ value }) => {
      if (!this.state.refreshEnabled && value <= 0) {
        this.setState({ refreshEnabled: true });
      } else if (this.state.refreshEnabled && value > 0) {
        this.setState({ refreshEnabled: false });
      }
    });
  }
  stop() {
    this.setState({ refreshing: false, refreshEnabled: false });
    Animated.spring(this.pan, {
      toValue: 0,
      useNativeDriver: true,
    }).start();

    setTimeout(
      () => {
        Animated.spring(this.refreshPan, {
          toValue: 0,
          useNativeDriver: true,
        }).start();
        this.props?.onRelease();
      },
      this.props.releaseDelay ? this.props.releaseDelay : 500
    );
    this.animation?.reset();
    this.animation?.play(1, 100);
    this.animation?.reset();

    Animated.timing(this.state.animProgress, {
      toValue: 42,
      duration: 0,
      useNativeDriver: true,
    }).start();
    setTimeout(() => {
      Animated.spring(this.state.animProgress, {
        toValue: 0,
        useNativeDriver: true,
      }).start();
    }, 1);
  }
  scrollView = React.createRef();
  panhandler = React.createRef();
  pan = new Animated.Value(0);
  refreshPan = new Animated.Value(0);
  render() {
    return (
      <View style={{ flex: 1 }}>
        <Animated.View
          style={{
            justifyContent: "center",
            alignItems: "center",
            position: "absolute",
            width: "100%",
            top: -50,
            transform: [
              {
                translateY: this.pan.interpolate({
                  inputRange: [0, 50, Dimensions.get("screen").height],
                  outputRange: [0, 0, Dimensions.get("screen").height],
                }),
              },
            ],
            opacity: this.state.refreshing
              ? 1
              : this.pan.interpolate({
                  inputRange: [0, 5],
                  outputRange: [0, 1],
                }),
          }}>
          <LottieView
            ref={(animation) => {
              this.animation = animation;
            }}
            progress={
              this.state.refreshing
                ? null
                : this.state.animProgress.interpolate({
                    inputRange: [0, 60, Dimensions.get("screen").height],
                    outputRange: [0, 0.42, 0.42],
                  })
            }
            style={{
              width: 100,
              backgroundColor: "transparent",
            }}
            source={require("../../../assets/refresh.json")}
          />
        </Animated.View>
        <Animated.View
          style={{
            transform: [
              {
                translateY: this.refreshPan,
              },
            ],
            flex: 1,
          }}>
          <Animated.View
            style={{
              transform: [
                {
                  translateY: this.pan.interpolate({
                    inputRange: [0, 10, 100],
                    outputRange: [0, 20, 110],
                  }),
                },
              ],
              flex: 1,
            }}>
            <PanGestureHandler
              ref={this.panhandler}
              enabled={this.state.refreshEnabled}
              activeOffsetY={10}
              onGestureEvent={(e) => {
                // console.log(e.nativeEvent.translationY);
                const dy = e.nativeEvent.translationY;
                if (dy < 0) {
                  this.setState({ refreshEnabled: false, refreshing: false });
                  Animated.timing(this.pan, {
                    toValue: 0,
                    duration: 0,
                    useNativeDriver: true,
                  }).start();
                  Animated.timing(this.state.animProgress, {
                    toValue: 0,
                    duration: 0,
                    easing: Easing.linear,
                    useNativeDriver: true,
                  }).start();
                  this.props?.onRefreshScroll(0);
                } else {
                  if (this.state.refreshing && dy * 0.4 < 80)
                    this.props?.onRefreshScroll(80);
                  else this.props?.onRefreshScroll(dy);
                  Animated.timing(this.pan, {
                    toValue: dy * 0.4,
                    duration: 0,
                    useNativeDriver: true,
                  }).start();
                  Animated.timing(this.state.animProgress, {
                    toValue: dy * 0.4,
                    duration: 0,
                    easing: Easing.linear,
                    useNativeDriver: true,
                  }).start();
                }
                if (dy * 0.4 > 80 && !this.state.refreshing) {
                  this.setState({ refreshing: true });
                  this.animation?.play(43, 73);
                  this.props?.onRefresh();
                  Animated.spring(this.refreshPan, {
                    toValue: 60,
                    useNativeDriver: true,
                  }).start();
                }
              }}
              onHandlerStateChange={(e) => {
                if (e.nativeEvent.state !== 4) {
                  Animated.spring(this.pan, {
                    toValue: 0,
                    useNativeDriver: true,
                  }).start();
                  if (this.state.refreshing) this.props?.onRefreshScroll(80);
                  else this.props?.onRelease();
                  Animated.spring(this.state.animProgress, {
                    toValue: 0,
                    useNativeDriver: true,
                  }).start();
                }
              }}
              simultaneousHandlers={this.scrollView}
              style={{ flex: 1 }}>
              <ScrollView
                waitFor={this.panhandler}
                style={this.props.style}
                enabled={!this.state.refreshing}
                onScroll={(e) => {
                  Animated.event(
                    [
                      {
                        nativeEvent: {
                          contentOffset: { y: this.state.scrollY },
                        },
                      },
                    ],
                    { useNativeDriver: false }
                  )(e);
                  if (!this.state.refreshing) this.props.onScroll(e);
                }}>
                {this.props.children}
              </ScrollView>
            </PanGestureHandler>
          </Animated.View>
        </Animated.View>
      </View>
    );
  }
}

export default ScrollRefreshView;
