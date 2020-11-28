import { Layout } from "@ui-kitten/components";
import React, { Component } from "react";
import { Dimensions, Animated, Vibration } from "react-native";
import {
  PanGestureHandler,
  PinchGestureHandler,
  RotationGestureHandler,
  State,
} from "react-native-gesture-handler";
export default class GestureHandler extends Component {
  state = {
    rotate: "0deg",
    scale: 1,
    translationX: 0,
    translationY: 0,
    changed: false,
  };
  constructor(props) {
    super(props);
    this.panRef = React.createRef();
    this.rotateRef = React.createRef();
    this.pichRef = React.createRef();
    this.panX = new Animated.Value(0);
    this.panY = new Animated.Value(0);
    this.rotate = new Animated.Value(0);
    this.scale = new Animated.Value(1);
    this.opacity = new Animated.Value(1);
  }
  componentDidUpdate() {
    if (!this.state.changed) {
      this.setState({ changed: true });
      this.props?.onChange();
    }
  }
  render() {
    return (
      <Layout style={[this.props.style, { backgroundColor: "transparent" }]}>
        <Animated.View
          style={{
            backgroundColor: "transparent",
            top: this.panY,
            left: this.panX,
            transform: [
              { scale: this.scale },
              {
                rotateZ: this.rotate.interpolate({
                  inputRange: [0, 360],
                  outputRange: ["0deg", "360deg"],
                }),
              },
            ],
            opacity: this.opacity,
          }}>
          <RotationGestureHandler
            ref={this.rotateRef}
            style={{
              backgroundColor: "transparent",
            }}
            simultaneousHandlers={[this.pichRef, this.panRef]}
            onHandlerStateChange={(e) => {
              if (e.nativeEvent.state == State.END) {
                Animated.timing(this.rotate, {
                  toValue: 0,
                  duration: 0,
                  useNativeDriver: false,
                }).start();
                this.setState({
                  rotate:
                    e.nativeEvent.rotation * (180 / Math.PI) +
                    parseFloat(this.state.rotate.replace("deg", "")) +
                    "deg",
                });
              }
            }}
            onGestureEvent={(e) => {
              Animated.timing(this.rotate, {
                toValue: e.nativeEvent.rotation * (180 / Math.PI),
                duration: 0,
                useNativeDriver: false,
              }).start();
            }}>
            <PinchGestureHandler
              ref={this.pichRef}
              style={{
                backgroundColor: "transparent",
              }}
              simultaneousHandlers={[this.rotateRef, this.panRef]}
              onHandlerStateChange={(e) => {
                if (e.nativeEvent.state == State.END) {
                  Animated.timing(this.scale, {
                    toValue: 1,
                    duration: 0,
                    useNativeDriver: false,
                  }).start();
                  var scale_ = e.nativeEvent.scale;
                  var scale = this.state.scale;
                  if (scale === 1) {
                    scale = scale_;
                  } else if (scale > 1) {
                    scale = scale_ + (1 - scale);
                  } else {
                    scale = scale_ - (1 - scale);
                  }
                  if (scale < 0.2) {
                    scale = 0.2;
                  }
                  this.setState({
                    scale,
                  });
                }
              }}
              onGestureEvent={(e) => {
                Animated.timing(this.scale, {
                  toValue: e.nativeEvent.scale,
                  duration: 0,
                  useNativeDriver: false,
                }).start();
              }}>
              <PanGestureHandler
                ref={this.panRef}
                style={{
                  backgroundColor: "transparent",
                }}
                simultaneousHandlers={[this.pichRef, this.rotateRef]}
                onHandlerStateChange={(e) => {
                  if (e.nativeEvent.state == State.END) {
                    if (this.props.delete)
                      if (
                        e.nativeEvent.absoluteY + 70 >
                          Dimensions.get("screen").height &&
                        this.state.deletion
                      ) {
                        this.props.delete();
                      }
                    Animated.timing(this.panX, {
                      toValue: 0,
                      duration: 0,
                      useNativeDriver: false,
                    }).start();
                    Animated.timing(this.panY, {
                      toValue: 0,
                      duration: 0,
                      useNativeDriver: false,
                    }).start();
                    this.setState({
                      translationX:
                        e.nativeEvent.translationX + this.state.translationX,
                      translationY:
                        e.nativeEvent.translationY + this.state.translationY,
                    });
                  }
                }}
                onGestureEvent={(e) => {
                  if (this.props.deletion) {
                    if (
                      e.nativeEvent.absoluteY + 70 >
                        Dimensions.get("screen").height &&
                      !this.state.deletion
                    ) {
                      this.setState({ deletion: true });
                      Animated.timing(this.opacity, {
                        toValue: 0.5,
                        duration: 0,
                        useNativeDriver: false,
                      }).start();
                      Animated.timing(this.scale, {
                        toValue: 0.8,
                        duration: 150,
                        useNativeDriver: false,
                      }).start();
                      Vibration.vibrate(50);
                      this.props.deletion(true);
                    } else if (
                      this.state.deletion &&
                      e.nativeEvent.absoluteY + 70 <
                        Dimensions.get("screen").height
                    ) {
                      this.setState({ deletion: false });
                      Animated.timing(this.opacity, {
                        toValue: 1,
                        duration: 0,
                        useNativeDriver: false,
                      }).start();
                      Animated.timing(this.scale, {
                        toValue: 1,
                        duration: 150,
                        useNativeDriver: false,
                      }).start();
                      this.props.deletion(false);
                    }
                  }
                  Animated.timing(this.panX, {
                    toValue: e.nativeEvent.translationX,
                    duration: 0,
                    useNativeDriver: false,
                  }).start();
                  Animated.timing(this.panY, {
                    toValue: e.nativeEvent.translationY,
                    duration: 0,
                    useNativeDriver: false,
                  }).start();
                }}>
                <Animated.View
                  style={{
                    backgroundColor: "transparent",
                    transform: [
                      { rotateZ: this.state.rotate },
                      { scale: this.state.scale },
                    ],

                    left:
                      this.state.translationX >
                      Dimensions.get("screen").width - 50
                        ? Dimensions.get("screen").width - 50
                        : this.state.translationX <
                          -Dimensions.get("screen").width + 50
                        ? -Dimensions.get("screen").width + 50
                        : this.state.translationX,

                    top:
                      this.state.translationY >
                      Dimensions.get("screen").height - 150
                        ? Dimensions.get("screen").height - 150
                        : this.state.translationY <
                          -Dimensions.get("screen").height + 150
                        ? -Dimensions.get("screen").height + 150
                        : this.state.translationY,
                  }}>
                  {this.props.children}
                </Animated.View>
              </PanGestureHandler>
            </PinchGestureHandler>
          </RotationGestureHandler>
        </Animated.View>
      </Layout>
    );
  }
}
