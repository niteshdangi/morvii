import React, { Component } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { Icon, Layout, Text, Button } from "@ui-kitten/components";
import { TouchableRipple } from "react-native-paper";
import { connect } from "react-redux";
import { setShortModal, setShortModalProps } from "../../actions/ShortModal";
import {
  Dimensions,
  RefreshControl,
  Image,
  Animated,
  Alert,
} from "react-native";
import * as Icons from "@expo/vector-icons";
import {
  ScrollView,
  TouchableWithoutFeedback,
  LongPressGestureHandler,
  State,
} from "react-native-gesture-handler";
import * as Constants from "../Constants";
import { Easing } from "react-native-reanimated";
import { Rating } from "react-native-ratings";
export default class UserObj extends Component {
  state = { user: this.props.item };
  follow(accept = false) {
    const url = accept
      ? "/accounts/follow/accept/"
      : "/accounts/follow/request/";
    fetch(Constants.API_URL + url, {
      method: "POST",
      headers: {
        Accept: "application/json",
        Authorization: "Token " + this.props.token,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ user: this.state.user.username }),
    })
      .then((response) => {
        const statusCode = response.status;
        const data = response.json();
        return Promise.all([statusCode, data]);
      })
      .then(([statusCode, data]) => {
        this.setState({ user: { ...this.state.user, ...data } });
      })
      .catch(() => {
        this.setState({ loading: false });
      });
  }
  unfollow() {
    fetch(Constants.API_URL + "/accounts/unfollow/", {
      method: "POST",
      headers: {
        Accept: "application/json",
        Authorization: "Token " + this.props.token,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ user: this.state.user.username }),
    })
      .then((response) => {
        const statusCode = response.status;
        const data = response.json();
        return Promise.all([statusCode, data]);
      })
      .then(([statusCode, data]) => {
        this.setState({ user: { ...this.state.user, ...data } });
      })
      .catch(() => {
        this.setState({ loading: false });
      });
  }
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
        style={{ ...this.props.style }}
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
              flexDirection: "row",
              flexWrap: "wrap",
              justifyContent: "space-between",
              alignItems: "center",

              paddingVertical: 5,
              elevation: 3,
              borderRadius: 15,
              paddingHorizontal: 5,
              margin: 5,
            }}>
            <Layout style={{ flexDirection: "row" }}>
              <Layout
                style={{
                  borderRadius: 5,
                  marginRight: 10,
                  padding: 3,
                }}>
                <Image
                  source={{ uri: this.state.user.profile.image }}
                  style={{
                    width: 50,
                    height: 70,
                    borderRadius: 5,
                  }}
                />
              </Layout>
              {this.props?.username === this.state.user.username ? (
                <Layout style={{ justifyContent: "space-evenly" }}>
                  <Text>You</Text>
                </Layout>
              ) : this.state.user.first_name + this.state.user.last_name ? (
                <Layout style={{ justifyContent: "space-evenly" }}>
                  <Text category="h6">
                    {this.state.user.first_name +
                      " " +
                      this.state.user.last_name}
                  </Text>
                  <Text appearance="hint" style={{ marginTop: -5 }}>
                    {this.state.user.username}
                  </Text>
                </Layout>
              ) : (
                <Layout style={{ justifyContent: "space-evenly" }}>
                  <Text>{this.state.user.username}</Text>
                </Layout>
              )}
            </Layout>
            <Layout style={{ alignItems: "flex-end" }}>
              {this.props.rating ? (
                <Rating
                  type="custom"
                  ratingColor="orange"
                  showRating={false}
                  imageSize={25}
                  readonly={true}
                  startingValue={this.props.rating}
                  style={{ marginBottom: 10 }}
                />
              ) : (
                <Layout
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    marginBottom: 10,
                  }}>
                  <Icons.FontAwesome name="star-o" size={15} color="black" />
                  <Text style={{ marginLeft: 5, fontSize: 13 }}>4.9</Text>
                </Layout>
              )}
              {this.state.user.accept ? (
                <Button
                  onPress={() => this.follow(true)}
                  size="small"
                  style={{
                    padding: 0,
                    height: 10,
                    maxHeight: 10,
                  }}>
                  Accept
                </Button>
              ) : this.state.user.requested ? (
                <Button
                  size="small"
                  appearance="outline"
                  style={{
                    padding: 0,
                    height: 10,
                    maxHeight: 10,
                  }}>
                  Requested
                </Button>
              ) : this.state.user.following !== null ? (
                !this.state.user.following ? (
                  this.state.user.followback ? (
                    <Button
                      onPress={() => this.follow()}
                      size="small"
                      style={{
                        padding: 0,
                        height: 10,
                        maxHeight: 10,
                      }}>
                      Follow Back
                    </Button>
                  ) : (
                    <Button
                      onPress={() => this.follow()}
                      size="small"
                      style={{
                        padding: 0,
                        height: 10,
                        maxHeight: 10,
                      }}>
                      Follow
                    </Button>
                  )
                ) : (
                  <Button
                    onPress={() => {
                      if (this.state.user.profile.private) {
                        Alert.alert(
                          "Private Account",
                          "You have to request again to follow!",
                          [
                            {
                              text: "Unfollow",
                              onPress: () => {
                                this.unfollow();
                              },
                            },
                            { text: "Cancel" },
                          ]
                        );
                      } else {
                        this.unfollow();
                      }
                    }}
                    appearance="outline"
                    size="small"
                    style={{
                      padding: 0,
                      height: 10,
                      maxHeight: 10,
                    }}>
                    Following
                  </Button>
                )
              ) : null}
            </Layout>
          </Layout>
        </Animated.View>
      </TouchableWithoutFeedback>
    );
  }
}
