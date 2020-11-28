import React from "react";
import { Layout, Divider, Input, Spinner } from "@ui-kitten/components";
import { connect } from "react-redux";
import StoryView from "../component/home/stories";
import { Text, Icon } from "@ui-kitten/components";
import { setShortModal, setShortModalProps } from "../actions/ShortModal";
import {
  View,
  Image,
  Animated,
  Dimensions,
  TextInput,
  StatusBar,
} from "react-native";
import {
  TouchableWithoutFeedback,
  TouchableOpacity,
  ScrollView,
} from "react-native-gesture-handler";
import { Easing } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import * as Constants from "./Constants";
import Ripple from "react-native-material-ripple";
import ShortModal from "./ShortModal";
import PinchableBox from "./home/PinchableImage";
import { Rating } from "react-native-ratings";
import DoubleClick from "react-native-double-tap";
import Comment from "./home/Comment";
import Swiper from "react-native-swiper";
import { v4 as uuidv4 } from "uuid";

class PostScreen extends React.Component {
  state = { sindex: 0, extraLoad: true, comments: [] };
  componentDidMount() {
    if (this.props.route) {
      if (this.props.route.params) {
        if (this.props.route.params.mopic) {
          this.setState({ mopic: this.props.route.params.mopic });
          this.fetch(this.props.route.params.mopic.id);
          return true;
        }
      }
    }
    this.props.navigation.goBack();
  }
  fetch(mid) {
    fetch(Constants.API_URL + "/mopic/" + mid + "/", {
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
        if (statusCode === 200) {
          this.setState({
            mopic: data.mopic,
            comments: data.comments,
            extraLoad: false,
          });
        } else {
          this.setState({ extraLoad: false });
        }
      })
      .catch(() => {
        this.setState({ extraLoad: false });
      });
  }
  convertInt(int) {
    return int
      ? int < 1000
        ? int
        : int < 1000000
        ? Math.round(int / 1000) + "K"
        : Math.round(int / 1000000) + "M"
      : 0;
  }
  postComment() {
    const comment = this.state.self_comment;
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
      Constants.API_URL + "/mopic/" + this.state.mopic.id + "/new/comment/",
      {
        method: "POST",
        headers: {
          Accept: "application/json",
          Authorization: "Token " + this.props.auth.token,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ comment: comment, reply, rid: newComment.id }),
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
  like() {
    this.setState({
      mopic: { ...this.state.mopic, liked: !this.state.mopic.liked },
    });
    fetch(Constants.API_URL + "/mopic/" + this.state.mopic.id + "/like/", {
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
            mopic: {
              ...this.state.mopic,
              liked: data.liked,
              likes: data.likes,
            },
          });
        } else {
          this.setState({
            mopic: { ...this.state.mopic, liked: !this.state.mopic.liked },
          });
        }
      })
      .catch(() => {
        this.setState({
          mopic: { ...this.state.mopic, liked: !this.state.mopic.liked },
        });
      });
  }

  onRateChange(value) {
    this.setState({
      mopic: { ...this.state.mopic, rating: value },
    });
    fetch(Constants.API_URL + "/mopic/" + this.state.mopic.id + "/rate/", {
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
        if (statusCode === 200) {
          this.setState({
            mopic: {
              ...this.state.mopic,
              rate: data.rate,
              ratingsCount: data.count,
            },
          });
        } else {
          this.setState({
            mopic: { ...this.state.mopic, rating: 0 },
          });
        }
      })
      .catch(() => {
        this.setState({
          mopic: { ...this.state.mopic, rating: 0 },
        });
      });
  }
  render() {
    let scaleValue = new Animated.Value(0);
    const cardScale = scaleValue.interpolate({
      inputRange: [0, 0.25, 0.5, 1],
      outputRange: [1, 1.1, 1.3, 1.2],
    });
    const rotateScale = scaleValue.interpolate({
      inputRange: [0, 0.25, 0.5, 0.75, 1],
      outputRange: ["0deg", "30deg", "0deg", "-30deg", "0deg"],
    });
    const opacityScale = scaleValue.interpolate({
      inputRange: [0, 1],
      outputRange: [0, 0.8],
    });
    let transformStyleCenter = {
      transform: [{ scale: cardScale }, { rotate: rotateScale }],
      opacity: opacityScale,
    };
    let transformStyle = { transform: [{ scale: cardScale }] };
    const flikr = () => {
      scaleValue.setValue(0);
      Animated.spring(scaleValue, {
        toValue: 1,
        easing: Easing.linear,
        useNativeDriver: true,
      }).start();
      setTimeout(() => {
        Animated.spring(scaleValue, {
          toValue: 0,
          duration: 100,
          easing: Easing.linear,
          useNativeDriver: true,
        }).start();
      }, 200);
    };
    Animated.spring(scaleValue, {
      toValue: 0,
      duration: 100,
      easing: Easing.linear,
      useNativeDriver: true,
    }).start();
    return (
      <SafeAreaView style={{ flex: 1 }}>
        <Layout
          style={{
            width: "100%",
            height: 50,
            justifyContent: "space-between",
            alignItems: "center",
            flexDirection: "row",
            paddingRight: 10,
            paddingLeft: 10,
          }}>
          <Layout
            style={{
              flexDirection: "row",
              justifyContent: "center",
              alignItems: "center",
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
            <Text style={{ fontSize: 18, padding: 10 }}>Mopic</Text>
          </Layout>
          <TouchableOpacity
            style={{ padding: 10 }}
            onPress={() => {
              this.props.setShortModal(true, "Options");
              this.props.setShortModalProps({
                component: "postOptions",
                extra: true,
                mopic: this.state?.mopic,
              });
            }}>
            <Icon
              name="more-vertical-outline"
              style={{
                width: 22,
                height: 22,
                tintColor: "black",
              }}
            />
          </TouchableOpacity>
        </Layout>
        <ScrollView>
          <Layout
            level="2"
            style={{
              marginTop: 2,
              minHeight: Dimensions.get("window").height - 20,
            }}>
            <Layout
              level="2"
              style={{
                flexWrap: "wrap",
                flexDirection: "row",
              }}>
              <View
                style={{
                  margin: 5,
                  zIndex: 2,
                }}>
                <StoryView
                  size={35}
                  image={this.state?.mopic?.user?.profile.image}
                  styleIn={{
                    margin: 5,
                    backgroundColor: "white",
                  }}
                  onPress={() =>
                    this.props.setShortModal(
                      true,
                      "Profile",
                      this.state?.mopic?.user
                    )
                  }
                />
              </View>
              <View style={{ marginTop: 13 }}>
                <Text category="h6">{this.state?.mopic?.user?.username}</Text>
                <Text appearance="hint" style={{ fontSize: 12 }}>
                  {this.state?.mopic?.location}
                </Text>
              </View>
            </Layout>

            <Layout
              level="2"
              style={{
                width: "100%",
                elevation: 1,
              }}>
              {this.state?.mopic?.media?.length > 0 && (
                <Swiper
                  style={{
                    height: Dimensions.get("screen").width + 50,
                  }}>
                  {this.state?.mopic?.media?.map((item, index) =>
                    item.mimetype.includes("video") ? (
                      <Layout style={{ elevation: 2, paddingBottom: 50 }}>
                        <PinchableBox
                          doubleTap={() => {
                            flikr();
                            setTimeout(this.like.bind(this), 500);
                          }}
                          mediaType="video"
                          uri={item.uri}
                        />
                      </Layout>
                    ) : (
                      <Layout style={{ elevation: 2, paddingBottom: 50 }}>
                        <PinchableBox
                          doubleTap={() => {
                            flikr();
                            setTimeout(this.like.bind(this), 500);
                          }}
                          uri={item.uri}
                        />
                      </Layout>
                    )
                  )}
                </Swiper>
              )}
            </Layout>
            <Animated.View
              style={{
                ...transformStyleCenter,
                // opacity: 0,
                position: "absolute",
                width: Dimensions.get("screen").width,
                height: Dimensions.get("screen").width + 50,
                justifyContent: "center",
                alignItems: "center",
                top: StatusBar.currentHeight,
                zIndex: 400,
                elevation: 10,
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
                flexWrap: "wrap",
                flexDirection: "row",
                padding: 10,
                width: "100%",
                justifyContent: "space-between",
                alignItems: "center",
              }}>
              <Layout
                style={{
                  flexDirection: "row",
                  flexWrap: "wrap",
                  alignItems: "center",
                }}>
                <Rating
                  type="custom"
                  ratingColor="orange"
                  showRating={false}
                  imageSize={25}
                  startingValue={this.state?.mopic?.rate}
                  readonly={true}
                  onFinishRating={this.ratingCompleted}
                  style={{ paddingRight: 10 }}
                />
                <Text>{this.state?.mopic?.rate}</Text>
              </Layout>
              <Layout style={{ flexDirection: "row" }}>
                <TouchableWithoutFeedback
                  onPress={() => {
                    flikr();
                    setTimeout(this.like.bind(this), 500);
                  }}
                  style={{ paddingLeft: 5 }}>
                  <Animated.View style={transformStyle}>
                    <Icon
                      name={
                        this.state?.mopic?.liked ? "heart" : "heart-outline"
                      }
                      style={{ width: 25, height: 25, tintColor: "red" }}
                    />
                  </Animated.View>
                </TouchableWithoutFeedback>
                <Text>{this.convertInt(this.state?.mopic?.likes)}</Text>
              </Layout>
            </Layout>
            <Divider />
            <Layout
              style={{
                flexDirection: "row",
                padding: 10,
                justifyContent: "space-between",
              }}>
              <Text>Rate this Mopic: </Text>

              <TouchableOpacity>
                {this.state?.extra?.ratingsCount != "0" && (
                  <Text>
                    {this.convertInt(this.state?.mopic?.ratingCount)} Ratings
                  </Text>
                )}
              </TouchableOpacity>
            </Layout>
            <Layout>
              <Rating
                type="custom"
                ratingColor="orange"
                showRating={false}
                imageSize={25}
                startingValue={
                  this.state?.mopic?.rating ? this.state?.mopic?.rating : 0
                }
                onFinishRating={(value) => this.onRateChange(value)}
                style={{ padding: 10 }}
              />
            </Layout>
            <Divider />
            {this.state?.mopic?.caption && (
              <Layout style={{ padding: 15 }}>
                <Text>{this.state?.mopic?.caption}</Text>
              </Layout>
            )}

            <Divider />
            {this.state?.mopic?.privateCount != "0" && (
              <Layout
                level="2"
                style={{
                  flexDirection: "row",
                  padding: 15,
                  alignItems: "center",
                }}>
                <Icon
                  name="lock-outline"
                  style={{
                    width: 27,
                    height: 27,
                    tintColor: "black",
                  }}
                />
                <Text style={{ paddingLeft: 10 }}>
                  {this.convertInt(this.state?.mopic?.privateCount)} Private
                  Comments
                </Text>
              </Layout>
            )}
            <Divider />
            <Layout
              level="2"
              style={{
                flexDirection: "row",
                padding: 10,
                justifyContent: "space-between",
                alignItems: "center",
              }}>
              <Layout style={{ flexDirection: "row" }} level="2">
                <Layout level="2" style={{ marginRight: -30 }}>
                  <StoryView
                    size={20}
                    image={this.props.auth.user.profile.image}
                  />
                </Layout>
                <TextInput
                  placeholder="Enter a Comment..."
                  editable={true}
                  value={this.state?.self_comment}
                  onChangeText={(nextValue) => {
                    this.setState({ self_comment: nextValue });
                  }}
                  ref={(ref) => (this.commentInput = ref)}
                  onSubmitEditing={this.postComment.bind(this)}
                  disabled={false}
                  returnKeyType="send"
                  style={{ width: "100%", paddingLeft: 40, paddingRight: 30 }}
                />
              </Layout>

              <Layout
                level="2"
                style={{ flexDirection: "row", marginLeft: -50 }}>
                {!this.state.self_comment ? (
                  <>
                    <Text>{this.convertInt(this.state?.mopic?.comments)}</Text>
                    <Icon
                      name="message-circle-outline"
                      style={{
                        width: 22,
                        height: 22,
                        tintColor: "black",
                        marginLeft: 5,
                      }}
                    />
                  </>
                ) : (
                  <Ripple
                    style={{ paddingVertical: 5, paddingHorizontal: 10 }}
                    onPress={this.postComment.bind(this)}>
                    <Text style={{ color: "blue" }}>Post</Text>
                  </Ripple>
                )}
              </Layout>
            </Layout>
            <Divider />
            {this.state.extraLoad ? (
              <Layout
                style={{
                  justifyContent: "center",
                  alignItems: "center",
                  backgroundColor: "transparent",
                  height: 100,
                }}>
                <Spinner />
              </Layout>
            ) : this.state?.comments?.length > 0 ? (
              this.state?.comments?.map((item, index) => (
                <Comment
                  key={index}
                  reply={(comment, user) => {
                    this.replyComment(comment, user);
                  }}
                  profile={(user) =>
                    this.props.setShortModal(true, "Profile", user)
                  }
                  retryComment={this.retryComment.bind(this)}
                  data={item}
                />
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
            <Divider />
          </Layout>
        </ScrollView>
      </SafeAreaView>
    );
  }
}
const mapStateToProps = (state) => ({
  auth: state.secure.auth,
  HomeBasic: state.main.HomeReducer,
  ShortModal: state.main.ShortModal,
});

export default connect(mapStateToProps, {
  setShortModal,
  setShortModalProps,
})(PostScreen);
