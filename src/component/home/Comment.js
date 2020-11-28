import React from "react";
import { Layout, Icon, Spinner } from "@ui-kitten/components";
import StoryView from "./stories";
import { Text } from "@ui-kitten/components";
import { Animated, Dimensions } from "react-native";
import { Easing } from "react-native-reanimated";
import { TouchableWithoutFeedback } from "react-native-gesture-handler";
import DoubleClick from "react-native-double-tap";
import ParsedText from "react-native-parsed-text";
import Ripple from "react-native-material-ripple";
import * as Constants from "../Constants";
import LastActiveTimer from "../messenger/LastActiveTimer";

class CommentReply extends React.Component {
  openProfile(text) {
    this.props.profile(text.replace("@", ""));
  }
  delete() {
    this.setState({ deleted: true });
    fetch(
      Constants.API_URL +
        "/mopic/comment/" +
        this.props.id +
        "/" +
        this.props.data.id +
        "/",
      {
        method: "DELETE",
        headers: {
          Accept: "application/json",
          Authorization: "Token " + this.props.token,
          "Content-Type": "application/json",
        },
      }
    )
      .then((response) => {
        const statusCode = response.status;
        const data = "";
        return Promise.all([statusCode, data]);
      })
      .then(([statusCode, data]) => {
        if (statusCode !== 200)
          this.setState({
            deleted: false,
          });
      })
      .catch(() => {
        this.setState({ deleted: false });
      });
  }
  render() {
    const text =
      "$*" +
      this.props.data.user.username +
      "*$" +
      " " +
      this.props.data.comment;
    if (this.state?.deleted) return null;
    return (
      <>
        {this.props.data.saving && (
          <Layout
            style={{
              position: "absolute",
              left: 0,
              width: 70,
              bottom: 0,
              justifyContent: "center",
              alignItems: "center",
              height: 70,
              backgroundColor: "transparent",
            }}>
            <Spinner />
          </Layout>
        )}
        {this.props.data.failed && (
          <Layout
            style={{
              position: "absolute",
              right: 0,
              width: 70,
              justifyContent: "center",
              alignItems: "center",
              height: 70,
              backgroundColor: "transparent",
            }}>
            <Ripple
              onPress={() => this.props.retryComment(this.props.data.comment)}>
              <Icon
                name="alert-triangle-outline"
                style={{ width: 30, height: 30, tintColor: "red" }}
              />
            </Ripple>
          </Layout>
        )}
        <Layout
          style={{
            flexDirection: "column",
            padding: 10,
            backgroundColor: "#e5e5e5",
            borderTopLeftRadius: 10,
            borderBottomLeftRadius: 10,
            width: Dimensions.get("window").width - 70,
            marginVertical: 5,
            borderRightWidth: 5,
            borderRightColor: "green",
            marginLeft: 70,
            opacity: this.props.data.saving || this.props.data.failed ? 0.3 : 1,
          }}>
          <Layout
            style={{ backgroundColor: "transparent", flexDirection: "row" }}>
            <StoryView
              size={25}
              image={this.props.data.user.profile.image}
              onPress={() => this.props.profile(this.props.data.user.username)}
            />
            <ParsedText
              parse={[
                { pattern: /#(\w+)/, style: { color: "blue" } },
                {
                  pattern: /@(\w+)/,
                  style: { color: "blue" },
                  onPress: this.openProfile.bind(this),
                },
                {
                  pattern: /\$\*(\w+)\*\$/,
                  style: { fontWeight: "bold" },
                  renderText: (text) =>
                    text.replace("$*", "").replace("*$", ""),
                },
              ]}
              style={{
                width: Dimensions.get("window").width - 120,
                paddingHorizontal: 5,
              }}>
              {text}
            </ParsedText>
          </Layout>
          <Layout
            style={{
              flexDirection: "row",
              backgroundColor: "transparent",
              justifyContent: "space-between",
              alignItems: "center",
              marginLeft: 45,
              marginTop: 5,
            }}>
            <LastActiveTimer time={new Date(this.props.data.datetime)} />

            {!this.props.data.saving && !this.props.data.failed && (
              <Layout
                style={{
                  flexDirection: "row",
                  justifyContent: "center",
                  alignItems: "center",
                  backgroundColor: "transparent",
                }}>
                {this.props.data.remove && (
                  <Ripple
                    onPress={() => {
                      this.delete();
                    }}>
                    <Text
                      appearance="hint"
                      style={{
                        fontSize: 14,
                        color: "red",
                        marginRight: 10,
                        opacity: 0.5,
                      }}>
                      Delete
                    </Text>
                  </Ripple>
                )}
                <Ripple onPress={this.props.reply}>
                  <Text appearance="hint" style={{ fontSize: 14 }}>
                    Reply
                  </Text>
                </Ripple>
              </Layout>
            )}
          </Layout>
        </Layout>
      </>
    );
  }
}

class Comment extends React.Component {
  state = {
    viewall: false,
    replies: [this.props.data?.reply?.comment],
    loading: false,
    reply: this.props.data?.reply,
    count: this.props.data.reply.count,
  };
  openProfile(text) {
    this.props.profile(text.replace("@", ""));
  }
  getReplies() {
    fetch(Constants.API_URL + "/mopic/comment/" + this.props.data.id + "/", {
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
          replies: data.data,
          loading: false,
          viewall: true,
        });
      })
      .catch(() => {
        this.setState({ loading: false });
      });
  }
  componentDidUpdate() {
    if (
      this.state.reply !== this.props.data?.reply &&
      this.props.data.reply.count
    ) {
      this.setState({
        reply: this.props.data.reply,
        count: this.state.count ? this.state.count + 1 : 1,
        viewall: false,
        replies: [],
      });
    }
  }
  delete() {
    this.setState({ deleted: true });
    fetch(Constants.API_URL + "/mopic/comment/" + this.props.data.id + "/", {
      method: "DELETE",
      headers: {
        Accept: "application/json",
        Authorization: "Token " + this.props.token,
        "Content-Type": "application/json",
      },
    })
      .then((response) => {
        const statusCode = response.status;
        const data = "";
        return Promise.all([statusCode, data]);
      })
      .then(([statusCode, data]) => {
        if (statusCode !== 200)
          this.setState({
            deleted: false,
          });
      })
      .catch(() => {
        this.setState({ deleted: false });
      });
  }
  render() {
    const text =
      "$*" +
      this.props.data.user.username +
      "*$" +
      " " +
      this.props.data.comment;
    if (this.state?.deleted) return null;
    return (
      <Layout>
        <Layout
          style={{
            flexDirection: "column",
            padding: 10,
            backgroundColor: "#e5e5e5",
            borderTopRightRadius: 10,
            borderBottomRightRadius: 10,
            width: Dimensions.get("window").width - 70,
            marginVertical: 5,
            borderLeftWidth: 5,
            borderLeftColor: "blue",
            opacity: this.props.data.saving || this.props.data.failed ? 0.3 : 1,
          }}>
          <Layout
            style={{
              backgroundColor: "transparent",
              flexDirection: "row",
            }}>
            <StoryView
              size={25}
              image={this.props.data.user.profile.image}
              onPress={() => this.props.profile(this.props.data.user.username)}
            />
            <ParsedText
              parse={[
                { pattern: /#(\w+)/, style: { color: "blue" } },
                {
                  pattern: /@(\w+)/,
                  style: { color: "blue" },
                  onPress: this.openProfile,
                },
                {
                  pattern: /\$\*(\w+)\*\$/,
                  style: { fontWeight: "bold" },
                  renderText: (text) =>
                    text.replace("$*", "").replace("*$", ""),
                },
              ]}
              style={{
                width: Dimensions.get("window").width - 120,
                paddingHorizontal: 5,
              }}>
              {text}
            </ParsedText>
          </Layout>
          <Layout
            style={{
              flexDirection: "row",
              backgroundColor: "transparent",
              justifyContent: "space-between",
              alignItems: "center",
              marginLeft: 45,
              marginTop: 5,
            }}>
            <LastActiveTimer time={new Date(this.props.data.datetime)} />
            {/* {this.props.data?.private && <Text>Private</Text>} */}

            {!this.props.data.saving && !this.props.data.failed && (
              <Layout
                style={{
                  flexDirection: "row",
                  justifyContent: "center",
                  alignItems: "center",
                  backgroundColor: "transparent",
                }}>
                {this.props.data.remove && (
                  <Ripple
                    onPress={() => {
                      this.delete();
                    }}>
                    <Text
                      appearance="hint"
                      style={{
                        fontSize: 14,
                        color: "red",
                        marginRight: 10,
                        opacity: 0.5,
                      }}>
                      Delete
                    </Text>
                  </Ripple>
                )}
                <Ripple
                  onPress={() =>
                    this.props.reply(
                      this.props.data,
                      "@" + this.props.data.user.username
                    )
                  }>
                  <Text appearance="hint" style={{ fontSize: 14 }}>
                    Reply
                  </Text>
                </Ripple>
              </Layout>
            )}
          </Layout>
        </Layout>

        {this.props.data.saving && (
          <Layout
            style={{
              position: "absolute",
              right: 0,
              width: 70,
              justifyContent: "center",
              alignItems: "center",
              height: 70,
              backgroundColor: "transparent",
            }}>
            <Spinner />
          </Layout>
        )}

        {this.props.data.failed && (
          <Layout
            style={{
              position: "absolute",
              right: 0,
              width: 70,
              justifyContent: "center",
              alignItems: "center",
              height: 70,
              backgroundColor: "transparent",
            }}>
            <Ripple
              onPress={() =>
                this.props.retryComment(this.props.data.comment, null)
              }>
              <Icon
                name="alert-triangle-outline"
                style={{ width: 30, height: 30, tintColor: "red" }}
              />
            </Ripple>
          </Layout>
        )}
        {!this.state.viewall ? (
          <>
            {this.props.data.reply.comment != null && (
              <CommentReply
                data={this.props.data.reply.comment}
                profile={(username) => this.props.profile(username)}
                id={this.props.data.id}
                token={this.props.token}
                reply={() =>
                  this.props.reply(
                    this.props.data,
                    "@" +
                      this.props.data.user.username +
                      " @" +
                      this.props.data.reply.comment.user.username
                  )
                }
                retryComment={(comment) =>
                  this.props.retryComment(comment, this.props.data)
                }
              />
            )}
            {this.state.count > 1 && (
              <Layout
                style={{
                  backgroundColor: "transparent",
                  justifyContent: "center",
                  alignItems: "center",
                }}>
                <Ripple
                  onPress={() => {
                    this.setState({ loading: true });
                    this.getReplies();
                  }}
                  style={{
                    backgroundColor: "#e5e5e5",
                    borderRadius: 25,
                    paddingHorizontal: 10,
                    paddingVertical: 5,
                  }}>
                  <Text appearance="hint" style={{ fontSize: 13 }}>
                    {this.state.loading
                      ? "Loading..."
                      : `View All ${this.state.count} Replies`}
                  </Text>
                </Ripple>
              </Layout>
            )}
          </>
        ) : (
          this.state?.replies?.map((item, index) => (
            <CommentReply
              key={index}
              data={item}
              token={this.props.token}
              id={this.props.data.id}
              profile={(username) => this.props.profile(username)}
              reply={() =>
                this.props.reply(
                  this.props.data,
                  "@" +
                    this.props.data.user.username +
                    " @" +
                    item.user.username
                )
              }
              retryComment={(comment) =>
                this.props.retryComment(comment, this.props.data)
              }
            />
          ))
        )}
      </Layout>
    );
  }
}

export default Comment;
