import React from "react";
import styled from "styled-components";
import {
  Animated,
  TouchableOpacity,
  Dimensions,
  Image,
  View,
  Alert,
  Share,
  ToastAndroid,
} from "react-native";
import { setShortModal } from "../../actions/ShortModal";
import { connect } from "react-redux";
import { Layout, Text, Divider, Icon, Toggle } from "@ui-kitten/components";
import FlexImage from "react-native-flex-image";
import Mopic from "./mopic";
import { TouchableRipple } from "react-native-paper";
import Ripple from "react-native-material-ripple";
import SwipeUpDown from "react-native-swipe-up-down";
import { TouchableWithoutFeedback } from "react-native-gesture-handler";
import Footer from "../utils/Footer";
import { setLoggedIn } from "../../actions/loginAction";
import * as APIConstants from "../Constants";
import { setDarkTheme, setMopics } from "../../actions/HomeActions";

const screenHeight = Dimensions.get("window").height * 1.2;
class OptionBt extends React.Component {
  state = { pressed: false };

  render() {
    const { props } = this;
    return (
      <TouchableWithoutFeedback
        onPressOut={() => {
          props.onPress ? props.onPress() : null;
          this.setState({ pressed: false });
        }}
        onPressIn={() => {
          this.setState({ pressed: true });
        }}
        style={{
          padding: 10,
          width: Dimensions.get("window").width,
          backgroundColor: this.state.pressed ? "#e9e9e9" : "transparent",
        }}>
        <Layout
          style={{
            backgroundColor: "transparent",
            flexDirection: "row",
          }}>
          {props.icon ? (
            <Icon
              name={props.icon}
              style={{
                width: 25,
                height: 25,
                tintColor: props.color ? props.color : "#555",
                marginRight: 20,
              }}
            />
          ) : props.image ? (
            <Image
              source={props.image}
              style={{
                width: 25,
                height: 25,
                marginRight: 20,
                borderRadius: 25,
                borderWidth: 2,
                borderColor: props.color ? props.color : "#555",
              }}
              resizeMode="cover"
            />
          ) : null}
          <Text
            category="h6"
            style={{ color: props.color ? props.color : "#000" }}>
            {props.text}
          </Text>
        </Layout>
      </TouchableWithoutFeedback>
    );
  }
}
class OptionsModal extends React.Component {
  state = {};
  report(type) {
    fetch(
      APIConstants.API_URL +
        "/report/" +
        type +
        "/mopic/" +
        this.props.ShortModal?.props?.mopic?.id +
        "/",
      {
        method: "GET",
        headers: {
          Accept: "application/json",
          Authorization: "Token " + this.props.auth.token,
          "Content-Type": "application/json",
        },
      }
    );
    this.props.setShortModal(false, "Options");
    ToastAndroid.show("Thanks for your feedback!", ToastAndroid.SHORT);
  }
  render() {
    const component = this.props.ShortModal.props.component
      ? this.props.ShortModal.props.component
      : null;
    const extra = this.props.ShortModal.props.extra
      ? this.props.ShortModal.props.extra
      : false;
    return (
      <Layout
        style={{
          backgroundColor: "transparent",
          height: Dimensions.get("window").height,
        }}>
        <Layout
          style={{
            height:
              component === "postOptions" && !extra
                ? Dimensions.get("window").height - 200
                : component === "postOptions" && extra
                ? Dimensions.get("window").height - 120
                : Dimensions.get("window").height - 300,
            backgroundColor: "transparent",
          }}></Layout>
        <Layout
          style={{
            justifyContent: "center",
            alignItems: "center",
            backgroundColor: "transparent",
            width: "100%",
          }}>
          <View
            style={{
              width: 40,
              height: 5,
              backgroundColor: "white",
              marginBottom: 10,
              borderRadius: 50,
            }}
          />
        </Layout>
        <Layout
          style={{
            backgroundColor: "white",
            minHeight: 400,
            borderTopRightRadius: 20,
            borderTopLeftRadius: 20,
            elevation: 5,
            overflow: "hidden",
          }}>
          {this.props.ShortModal.props.component ? (
            this.props.ShortModal.props.component === "settings" ? (
              <Layout
                style={{ backgroundColor: "transparent", paddingTop: 10 }}>
                <Layout
                  style={{
                    width: "100%",
                    justifyContent: "flex-start",
                    alignItems: "flex-start",
                    paddingLeft: 20,
                    paddingBottom: 10,
                  }}>
                  <Toggle
                    checked={this.props.darkMode}
                    onChange={() => {
                      this.props.setDarkTheme(!this.props.darkMode);
                    }}>
                    <Text category="h6">Dark Mode</Text>
                  </Toggle>
                </Layout>
                <Divider />
                <OptionBt
                  icon="edit-outline"
                  text="Edit Profile"
                  onPress={() => {
                    this.props.setShortModal(false);
                    this.props.navigation.navigate("ProfileEditScreen");
                  }}
                />
                <OptionBt
                  image={{ uri: "https://source.unsplash.com/random" }}
                  text="Change Picture"
                  onPress={() => {
                    this.props.setShortModal(false);
                    this.props.navigation.navigate("ProfileImageScreen", {
                      type: "primary",
                    });
                  }}
                />
                <OptionBt
                  icon="settings-outline"
                  text="Settings"
                  onPress={() => {
                    this.props.setShortModal(false);
                    this.props.navigation.navigate("SettingsScreen", {
                      type: "main",
                    });
                  }}
                />
                <OptionBt
                  icon="log-out-outline"
                  text="Logout"
                  onPress={() => {
                    fetch(APIConstants.API_URL + "/accounts/logout/", {
                      method: "POST",
                      headers: {
                        Accept: "application/json",
                        Authorization: "Token " + this.props.auth.token,
                        "Content-Type": "application/json",
                      },
                      body: JSON.stringify({ token: this.props.auth.token }),
                    })
                      .then((response) => {
                        const statusCode = response.status;
                        const data = response.json();
                        return Promise.all([statusCode, data]);
                      })
                      .then(([statusCode, data]) => {
                        this.props.setShortModal(false);
                      })
                      .catch(() => {
                        this.props.setShortModal(false);
                      });
                    this.props.setLoggedIn({
                      state: false,
                      token: null,
                      user: {
                        first_name: "",
                        last_name: "",
                        username: "",
                        profile: {},
                      },
                    });
                    this.props.setShortModal(true, "Loader");
                    this.props.navigation.navigate("Login");
                  }}
                />
                {/* <Footer /> */}
              </Layout>
            ) : this.props.ShortModal.props.component === "Delete" ? (
              <Layout
                style={{ backgroundColor: "transparent", paddingTop: 10 }}>
                <Text
                  style={{ padding: 15, color: "red", marginBottom: 15 }}
                  appearance="hint">
                  This Action is irreversible!
                </Text>
                <OptionBt
                  icon="trash-2-outline"
                  text="Delete"
                  color="red"
                  onPress={() => {
                    fetch(
                      APIConstants.API_URL +
                        "/mopic/" +
                        this.props.ShortModal.props.mopic +
                        "/",
                      {
                        method: "DELETE",
                        headers: {
                          Accept: "application/json",
                          Authorization: "Token " + this.props.auth.token,
                          "Content-Type": "application/json",
                        },
                        body: JSON.stringify({ token: this.props.auth.token }),
                      }
                    )
                      .then((response) => {
                        var mopics = [];
                        this.props.mopics.map(
                          (item) =>
                            item.id !== this.props.ShortModal.props.mopic &&
                            mopics.push(item)
                        );
                        this.props.setMopics(mopics);
                        ToastAndroid.show("Deleted!", ToastAndroid.SHORT);
                      })
                      .catch((e) => {
                        ToastAndroid.show(
                          "Failed to Delete!" + e,
                          ToastAndroid.SHORT
                        );
                      });
                    this.props.setShortModal(false, "Options");
                  }}
                />
                <Layout style={{ marginTop: 15 }}>
                  <OptionBt
                    icon="close-outline"
                    text="Cancel"
                    onPress={() => {
                      this.props.setShortModal(false, "Options");
                    }}
                  />
                </Layout>
              </Layout>
            ) : this.props.ShortModal.props.component === "Report" ? (
              <Layout
                style={{ backgroundColor: "transparent", paddingTop: 10 }}>
                <Text style={{ padding: 15 }} appearance="hint">
                  What is this User doing:
                </Text>
                <OptionBt
                  text="Abusing"
                  onPress={() => {
                    this.report("abuse");
                  }}
                />
                <OptionBt
                  text="Hatered"
                  onPress={() => {
                    this.report("hate");
                  }}
                />
                <OptionBt
                  text="Spam"
                  onPress={() => {
                    this.report("spam");
                  }}
                />
                <OptionBt
                  text="Fake News"
                  onPress={() => {
                    this.report("fake");
                  }}
                />
              </Layout>
            ) : this.props.ShortModal.props.component === "postOptions" ? (
              <Layout
                style={{ backgroundColor: "transparent", paddingTop: 10 }}>
                {this.props.ShortModal.props.mopic.user.username !==
                this.props.auth.user.username ? (
                  <>
                    <OptionBt
                      image={{
                        uri: this.props.ShortModal.props.mopic.user.profile
                          .image,
                      }}
                      text={
                        "View " +
                        this.props.ShortModal.props.mopic.user.username +
                        "'s Account"
                      }
                      onPress={() => {
                        this.props.setShortModal(false);
                        this.props.navigation.navigate("ProfileScreen", {
                          username: this.props.ShortModal.props.mopic.user
                            .username,
                        });
                      }}
                    />
                    <OptionBt
                      icon="clipboard-outline"
                      text="Report"
                      onPress={() => {
                        this.props.setShortModal(true, "Options", {
                          component: "Report",
                          mopic: this.props.ShortModal.props.mopic,
                        });
                      }}
                    />
                  </>
                ) : (
                  <>
                    <OptionBt
                      icon="trash-2-outline"
                      text="Delete"
                      onPress={() => {
                        this.props.setShortModal(true, "Options", {
                          component: "Delete",
                          mopic: this.props.ShortModal.props.mopic.id,
                        });
                      }}
                    />
                    <OptionBt
                      icon="message-circle-outline"
                      text={
                        this.props.ShortModal.props.mopic.comment_allow
                          ? "Turn off Comments"
                          : "Turn on Comments"
                      }
                      onPress={() => {
                        fetch(
                          APIConstants.API_URL +
                            "/mopic/" +
                            this.props.ShortModal.props.mopic.id +
                            "/comments/allowance/",

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
                            if (statusCode === 200) {
                              ToastAndroid.show(
                                "Settings Updated!",
                                ToastAndroid.SHORT
                              );
                              this.props.setMopics([
                                ...this.props.mopics.map((item) =>
                                  item.id ===
                                  this.props.ShortModal.props.mopic.id
                                    ? {
                                        ...item,
                                        comment_allow: !this.props.ShortModal
                                          .props.mopic.comment_allow,
                                      }
                                    : item
                                ),
                              ]);
                            } else {
                              ToastAndroid.show(
                                "Failed to Update!",
                                ToastAndroid.SHORT
                              );
                            }
                          })
                          .catch(() => {
                            ToastAndroid.show(
                              "Failed to Update!",
                              ToastAndroid.SHORT
                            );
                          });
                        this.props.setShortModal(false, "Options");
                      }}
                    />
                  </>
                )}

                <OptionBt
                  icon="share-outline"
                  text="Share Mopic"
                  onPress={async () => {
                    try {
                      setTimeout(async () => {
                        const result = await Share.share({
                          message: "http://192.168.43.76/",
                        });
                        if (result.action === Share.sharedAction) {
                          if (result.activityType) {
                            // shared with activity type of result.activityType
                          } else {
                            // shared
                          }
                        } else if (result.action === Share.dismissedAction) {
                          // dismissed
                        }
                      }, 30);
                    } catch (error) {
                      alert(error.message);
                    }
                  }}
                />

                <OptionBt
                  icon="link-2-outline"
                  text="Copy link"
                  onPress={() => {}}
                />
              </Layout>
            ) : null
          ) : null}
        </Layout>
      </Layout>
    );
  }
}
const Container = styled.View`
  position: absolute;
  width: 100%;
  height: 100%;
  z-index: 100;
`;

const AnimatedContainer = Animated.createAnimatedComponent(Container);

const mapStateToProps = (state) => ({
  ShortModal: state.main.ShortModal,
  auth: state.secure.auth,
  mopics: state.main.HomeReducer.mopics,
  darkMode: state.main.HomeReducer.darkTheme,
});
export default connect(mapStateToProps, {
  setShortModal,
  setLoggedIn,
  setMopics,
  setDarkTheme,
})(OptionsModal);
