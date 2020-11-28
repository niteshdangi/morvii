import React from "react";
import styled from "styled-components";
import {
  Animated,
  TouchableOpacity,
  Dimensions,
  Image,
  PanResponder,
  StatusBar,
  ScrollView,
  Keyboard,
  View,
  ToastAndroid,
} from "react-native";
import { setShortModal } from "../../actions/ShortModal";
import { connect } from "react-redux";
import {
  Layout,
  Text,
  Divider,
  Spinner,
  Icon,
  Input,
  Toggle,
} from "@ui-kitten/components";
import { v4 as uuidv4 } from "uuid";
import Ripple from "react-native-material-ripple";
import * as Constants from "../Constants";
import Comment from "./Comment";

const screenHeight = Dimensions.get("window").height * 1.2;

class CommentScreen extends React.Component {
  state = {
    loading: true,
    comments: [],
    scrollY: new Animated.Value(0),
    keyboardOffset: new Animated.Value(0),
    allowed: true,
    private: false,
    privateEnabled: false,
  };
  componentDidMount() {
    fetch(
      Constants.API_URL +
        "/mopic/" +
        this.props?.route.params?.mid +
        "/comments/",
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
        this.setState({
          comments: data.comments,
          loading: false,
          allowed: data.allowed,
          private: data.private,
        });
      })
      .catch(() => {
        this.setState({ loading: false });
      });
    // this.keyboardDidShowListener = Keyboard.addListener(
    //   "keyboardDidShow",
    //   this._keyboardDidShow.bind(this)
    // );
    // this.keyboardDidHideListener = Keyboard.addListener(
    //   "keyboardDidHide",
    //   this._keyboardDidHide.bind(this)
    // );
  }
  // _keyboardDidShow(event) {
  //   Animated.spring(this.state.keyboardOffset, {
  //     toValue: -event.endCoordinates.height - 75,
  //     useNativeDriver: true,
  //     bounciness: 0.5,
  //   }).start();
  // }

  // _keyboardDidHide() {
  //   Animated.spring(this.state.keyboardOffset, {
  //     toValue: 0,
  //     useNativeDriver: true,
  //     bounciness: 0.5,
  //   }).start();
  // }
  getStyle() {
    const { scrollY } = this.state;
    return {
      transform: [
        {
          translateY: scrollY.interpolate({
            inputRange: [0, Dimensions.get("screen").height],
            outputRange: [-Dimensions.get("screen").height / 2, 1],
          }),
        },
      ],
    };
  }
  postComment() {
    const comment = this.state.self_comment;
    if (!comment) {
      return false;
    }
    var comments = this.state.comments;
    var newComment = {
      id: uuidv4(),
      user: this.props.auth.user,
      comment: comment,
      datetime: new Date(),
      reply: { comment: null, count: 0 },
      saving: true,
    };
    var commentFailed = {
      id: uuidv4(),
      user: this.props.auth.user,
      comment: comment,
      datetime: new Date(),
      reply: { comment: null, count: 0 },
      failed: true,
    };
    var reply = false;
    if (this.state.replyComment) {
      reply = true;
      newComment = {
        ...this.state.replyComment,
        reply: {
          comment: newComment,
          count: this.state.replyComment.reply.count + 1,
        },
      };
      commentFailed = {
        ...this.state.replyComment,
        reply: {
          comment: commentFailed,
          count: this.state.replyComment.reply.count + 1,
        },
      };
      comments = comments.filter((item) =>
        item.id != this.state.replyComment.id ? item : null
      );
      this.setState({ replyComment: null });
    }
    this.setState({
      self_comment: "",
      comments: [newComment, ...comments],
    });
    fetch(
      Constants.API_URL +
        "/mopic/" +
        this.props?.route.params?.mid +
        "/new/comment/",
      {
        method: "POST",
        headers: {
          Accept: "application/json",
          Authorization: "Token " + this.props.auth.token,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          comment: comment,
          reply,
          rid: newComment.id,
          private: this.state.privateEnabled,
        }),
      }
    )
      .then((response) => {
        const statusCode = response.status;
        const data = response.json();
        return Promise.all([statusCode, data]);
      })
      .then(([statusCode, data]) => {
        if (statusCode === 200) {
          this.setState({
            comments: [data.comment, ...comments],
          });
        } else {
          this.setState({
            comments: [commentFailed, ...comments],
          });
        }
      })
      .catch(() => {
        this.setState({
          comments: [commentFailed, ...comments],
        });
      });
  }
  replyComment(comment, user) {
    this.commentInput.focus();
    this.setState({
      self_comment: user + " ",
      replyComment: comment,
    });
  }
  retryComment(comment, reply) {
    this.setState({
      self_comment: comment,
      replyComment: reply,
      comments: this.state.comments.slice(1, this.state.comments.length - 1),
    });
    setTimeout(() => this.postComment(), 200);
  }
  render() {
    return (
      <Layout style={{ flex: 1, backgroundColor: "transparent" }}>
        <Layout
          style={{
            width: "100%",
            justifyContent: "space-between",
            alignItems: "center",
            flexDirection: "row",
            paddingRight: 10,
            paddingLeft: 10,
            elevation: 5,
            borderTopLeftRadius: 15,
            borderTopRightRadius: 15,
            paddingTop: StatusBar.currentHeight,
          }}>
          <Layout
            style={{
              flexDirection: "row",
              justifyContent: "center",
              alignItems: "center",
              borderTopLeftRadius: 15,
              borderTopRightRadius: 15,
            }}>
            <Ripple
              style={{ padding: 10 }}
              onPress={() => this.props.navigation.goBack()}>
              <Icon
                name="arrow-back-outline"
                style={{
                  width: 27,
                  height: 27,
                  tintColor: "black",
                }}
              />
            </Ripple>
            <Text style={{ fontSize: 18, padding: 10 }}>Comments</Text>
          </Layout>
          {this.state.private && (
            <Toggle
              checked={this.state.privateEnabled}
              onChange={() => {
                ToastAndroid.show(
                  this.state.privateEnabled
                    ? "Private Comment Disabled"
                    : "Private Comment Enabled",
                  ToastAndroid.SHORT
                );
                this.setState({ privateEnabled: !this.state.privateEnabled });
              }}
              status="primary"></Toggle>
          )}
        </Layout>

        <ScrollView
          style={{
            flex: 1,
            flexGrow: 1,
            marginTop: -1,
            elevation: 1,
            zIndex: 100,
            backgroundColor: "#fff",
          }}>
          {this.state.loading ? (
            <Layout
              style={{
                justifyContent: "center",
                alignItems: "center",
                backgroundColor: "transparent",
                flex: 1,
              }}>
              <Spinner />
            </Layout>
          ) : this.state?.comments?.length > 0 ? (
            this.state?.comments?.map((item, index) => (
              <View key={index} style={{ elevation: 5, zIndex: 1000 }}>
                <Comment
                  reply={(comment, user) => {
                    this.replyComment(comment, user);
                  }}
                  profile={(user) =>
                    this.props.navigation.navigate("ProfileScreen", {
                      username: user,
                    })
                  }
                  retryComment={() => {
                    this.retryComment.bind(this);
                  }}
                  data={item}
                />
              </View>
            ))
          ) : (
            <Layout
              style={{
                justifyContent: "center",
                alignItems: "center",
                backgroundColor: "transparent",
                height: 60,
              }}>
              <Text>Be the First to Comment</Text>
            </Layout>
          )}
          <Layout style={{ height: 100 }} />
        </ScrollView>

        <Animated.View
          style={{
            backgroundColor: "#fff",
            elevation: 5,
          }}>
          <Input
            style={{ padding: 15 }}
            disabled={!this.state.allowed}
            placeholder={
              this.state.allowed
                ? this.state.privateEnabled
                  ? "Post a private comment..."
                  : "Post a comment..."
                : "Comments Disabled"
            }
            onSubmitEditing={this.postComment.bind(this)}
            value={this.state?.self_comment}
            onChangeText={(nextValue) => {
              this.setState({ self_comment: nextValue });
            }}
            returnKeyType="send"
            ref={(ref) => (this.commentInput = ref)}
          />
        </Animated.View>
      </Layout>
    );
  }
}
const mapStateToProps = (state) => ({
  auth: state.secure.auth,
});
export default connect(mapStateToProps, { setShortModal })(CommentScreen);
