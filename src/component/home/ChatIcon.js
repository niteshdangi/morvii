import { Icon, Layout, Text } from "@ui-kitten/components";
import React, { Component } from "react";
import { Animated } from "react-native";
import { TouchableOpacity } from "react-native-gesture-handler";
import { connect } from "react-redux";
class ChatIcon extends Component {
  state = { chatBubble: 1 };
  bubbleUsers = {};
  chatBubbleScale = new Animated.Value(0);
  sentBubble = new Animated.Value(0);
  seenBubble = new Animated.Value(0);
  viewEye = new Animated.Value(0);
  typing = new Animated.Value(0);
  typingUsers = {};
  viewers = {};
  componentDidMount() {
    this.props.navigation.addListener("focus", () => {
      if (this.props?.socket) {
        this.props.socket.onmessage = (e) => {
          const data = JSON.parse(e.data);
          console.log(data.type);
          if (data.type === "typing") {
            this.typingUsers[data.user] = data.value;
            var typingUsers = Object.values(this.typingUsers).reduce(
              (a, b) => (b ? a + 1 : a),
              0
            );

            Animated.spring(this.typing, {
              toValue: typingUsers > 0 ? 1 : 0,
              useNativeDriver: true,
            }).start();
          } else if (data.type === "viewer") {
            this.viewers[data.user] = data.value;
            var viewers = Object.values(this.viewers).reduce(
              (a, b) => (b ? a + 1 : a),
              0
            );
            Animated.spring(this.viewEye, {
              toValue: viewers > 0 ? 1 : 0,
              useNativeDriver: true,
            }).start();
          } else if (data.type === "seen_message") {
            Animated.spring(this.chatBubbleScale, {
              toValue: 0,
              useNativeDriver: true,
            }).start();
            Animated.spring(this.sentBubble, {
              toValue: 0,
              useNativeDriver: true,
            }).start();
            Animated.spring(this.seenBubble, {
              toValue: 1,
              useNativeDriver: true,
            }).start();
            setTimeout(() => {
              Animated.spring(this.chatBubbleScale, {
                toValue: this.state.chatBubble === 0 ? 0 : 1,
                useNativeDriver: true,
              }).start();
              Animated.spring(this.seenBubble, {
                toValue: 0,
                useNativeDriver: true,
              }).start();
            }, 1200);
          } else if (data.type === "sent_message") {
            Animated.spring(this.chatBubbleScale, {
              toValue: 0,
              useNativeDriver: true,
            }).start();
            Animated.spring(this.sentBubble, {
              toValue: 1,
              useNativeDriver: true,
            }).start();
            setTimeout(() => {
              Animated.spring(this.chatBubbleScale, {
                toValue: this.state.chatBubble === 0 ? 0 : 1,
                useNativeDriver: true,
              }).start();
              Animated.spring(this.sentBubble, {
                toValue: 0,
                useNativeDriver: true,
              }).start();
            }, 1000);
          } else if (data.type === "new_message") {
            if (!this?.bubbleUsers[data.message.sender]) {
              this.bubbleUsers[data.message.sender] = true;
              this.setState({ chatBubble: this.state.chatBubble + 1 });
            } else {
              Animated.spring(this.chatBubbleScale, {
                toValue: 1.2,
                useNativeDriver: true,
              }).start();
              setTimeout(() => {
                Animated.spring(this.chatBubbleScale, {
                  toValue: 1,
                  useNativeDriver: true,
                }).start();
              }, 200);
            }
          }
        };
      }
    });
    var bubleCount = 0;
    this.props.chatList.forEach((element) => {
      if (
        element.message.receiver === this.props.auth.user.username &&
        !element.message.seen
      ) {
        this.bubbleUsers[element.message.receiver] = true;
        bubleCount++;
      } else {
        if (this.bubbleUsers[element.message.receiver]) {
          this.bubbleUsers[element.message.receiver] = false;
        }
      }
    });
    if (bubleCount > 0) this.setState({ chatBubble: bubleCount });
    this.props.navigation.addListener("focus", () => {
      var bubleCount = 0;
      this.props.chatList.forEach((element) => {
        if (
          element.message.receiver === this.props.auth.user.username &&
          !element.message.seen
        ) {
          this.bubbleUsers[element.message.receiver] = true;
          bubleCount++;
        } else {
          if (this.bubbleUsers[element.message.receiver]) {
            this.bubbleUsers[element.message.receiver] = false;
          }
        }
      });
      if (bubleCount !== this.state.chatBubble)
        this.setState({ chatBubble: bubleCount });
    });
  }
  componentDidUpdate() {
    if (this.state.chatBubble != 0) {
      Animated.spring(this.chatBubbleScale, {
        toValue: 1,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.spring(this.chatBubbleScale, {
        toValue: 0,
        useNativeDriver: true,
      }).start();
    }
  }
  render() {
    return (
      <Layout>
        <Animated.View style={{ flexDirection: "row" }}>
          <TouchableOpacity onPress={() => {}}>
            <Icon
              style={{ tintColor: "black", width: 30, height: 30 }}
              name="message-circle-outline"
            />
          </TouchableOpacity>
          <Animated.View
            style={{
              width: 20,
              height: 20,
              borderRadius: 15,
              backgroundColor: "red",
              justifyContent: "center",
              alignItems: "center",
              paddingBottom: 3,
              marginLeft: -10,
              transform: [{ scale: this.chatBubbleScale }],
            }}>
            <Text style={{ color: "#fff", fontSize: 13 }}>
              {this.state.chatBubble}
            </Text>
          </Animated.View>
          <Animated.View
            style={{
              width: 20,
              height: 20,
              borderRadius: 15,
              backgroundColor: "orange",
              justifyContent: "center",
              alignItems: "center",
              paddingVertical: 1.5,
              marginLeft: 20,
              position: "absolute",
              transform: [
                {
                  scale: this.sentBubble.interpolate({
                    inputRange: [0, 0.8, 1],
                    outputRange: [0, 1.2, 1],
                  }),
                },
              ],
            }}>
            <Icon
              style={{ tintColor: "#fff", width: 20, height: 20 }}
              name="checkmark-outline"
            />
          </Animated.View>
          <Animated.View
            style={{
              width: 20,
              height: 20,
              borderRadius: 15,
              backgroundColor: "blue",
              justifyContent: "center",
              alignItems: "center",
              paddingVertical: 1.5,
              marginLeft: 20,
              position: "absolute",
              transform: [
                {
                  scale: this.seenBubble.interpolate({
                    inputRange: [0, 0.8, 1],
                    outputRange: [0, 1.2, 1],
                  }),
                },
              ],
            }}>
            <Icon
              style={{ tintColor: "#fff", width: 20, height: 20 }}
              name="done-all-outline"
            />
          </Animated.View>
          <Animated.View
            style={{
              width: 15,
              height: 15,
              borderRadius: 15,
              // backgroundColor: "red",
              justifyContent: "center",
              alignItems: "center",
              paddingVertical: 1.5,
              marginLeft: 7.5,
              position: "absolute",
              top: 14,
              opacity: this.viewEye,
            }}>
            <Icon
              style={{ tintColor: "blue", width: 10, height: 10 }}
              name="eye-outline"
            />
          </Animated.View>
          <Animated.View
            style={{
              width: 15,
              height: 15,
              borderRadius: 15,
              // backgroundColor: "red",
              justifyContent: "center",
              alignItems: "center",
              paddingVertical: 1.5,
              marginLeft: 20,
              position: "absolute",
              top: 15,
              opacity: this.typing,
            }}>
            <Text>...</Text>
          </Animated.View>
        </Animated.View>
      </Layout>
    );
  }
}

const mapStateToProps = (state) => ({
  auth: state.secure.auth,
  HomeBasic: state.main.HomeReducer,
  ShortModal: state.main.ShortModal,
  chatList: state.main.ChatReducer.list,
});
export default connect(mapStateToProps, null)(ChatIcon);
