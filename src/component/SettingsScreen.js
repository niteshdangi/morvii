import React, { Component } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  ScrollView,
  TouchableWithoutFeedback,
  FlatList,
} from "react-native-gesture-handler";
import {
  Layout,
  Text,
  Divider,
  Icon,
  Input,
  Spinner,
  Button,
  Toggle,
} from "@ui-kitten/components";
import Ripple from "react-native-material-ripple";
import {
  Image,
  BackHandler,
  Share,
  Dimensions,
  View,
  Alert,
  StatusBar,
} from "react-native";
import Constants from "expo-constants";
import * as APIConstants from "./Constants";
import Footer from "./utils/Footer";
import Animated, { Easing } from "react-native-reanimated";
import UserObj from "./profile/UserObj";
import { connect } from "react-redux";
import { setLoggedIn } from "../actions/loginAction";
class DeviceHistory extends Component {
  render() {
    let scaleValue = new Animated.Value(0);
    const cardScale = scaleValue.interpolate({
      inputRange: [0, 0.5, 1],
      outputRange: [1, 0.98, 0.97],
    });
    let transformStyle = { transform: [{ scale: cardScale }] };
    const device = JSON.parse(this.props.item.device);
    return (
      <TouchableWithoutFeedback
        onPress={() => {}}
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
              backgroundColor: "white",
              elevation: 5,
              margin: 5,
              padding: 10,
              borderRadius: 10,
            }}>
            {this.props.item.device ? (
              <>
                {/* {this.props.item.current ? (
                  <Text category="h6">This Device</Text>
                ) : ( */}
                <Text category="h6">
                  {device?.manufacturer +
                    " " +
                    device?.modelName +
                    " - " +
                    device?.deviceName}
                </Text>

                <Text appearance="hint">
                  {device?.osName + " " + device?.osVersion}
                </Text>
              </>
            ) : null}
            <Text appearance="hint">
              IP:{"  "}
              <Text style={{ fontSize: 12 }} appearance="hint">
                {this.props.item.ip}
              </Text>
            </Text>
            <Text appearance="hint">
              Login Time:{"  "}
              <Text style={{ fontSize: 12 }} appearance="hint">
                {new Date(this.props.item.loginTime).toDateString() +
                  " " +
                  new Date(this.props.item.loginTime)
                    .toTimeString()
                    .split(" ")[0]}
              </Text>
            </Text>
            {this.props.item.loggedIn ? (
              <Text>Logged IN</Text>
            ) : (
              <Text appearance="hint">
                Logout Time:{" "}
                <Text style={{ fontSize: 12 }} appearance="hint">
                  {new Date(this.props.item.logoutTime).toDateString() +
                    " " +
                    new Date(this.props.item.logoutTime)
                      .toTimeString()
                      .split(" ")[0]}
                </Text>
              </Text>
            )}
          </Layout>
        </Animated.View>
      </TouchableWithoutFeedback>
    );
  }
}
class SettingsScreen extends Component {
  state = {
    type: this.props.route.params
      ? this.props.route.params.type
        ? this.props.route.params.type
        : null
      : null,
    // type: "logins",
    stack: [],
    loginHistory: { data: [], loading: true },
    private: this.props?.auth?.user?.profile?.private,
    password: {
      otp: false,
      password: "",
      passwordConfirm: "",
      passwordNew: "",
      passSecure: true,
      passSecureNew: true,
      passSecureConfirm: true,
      errors: { password: "", passwordNew: "", passwordConfirm: "" },
      requestOtp: false,
    },
  };
  constructor(props) {
    super(props);
    this.handleBackButtonClick = this.handleBackButtonClick.bind(this);
  }

  UNSAFE_componentWillMount() {
    BackHandler.addEventListener(
      "hardwareBackPress",
      this.handleBackButtonClick
    );
  }

  UNSAFE_componentWillUnmount() {
    BackHandler.removeEventListener(
      "hardwareBackPress",
      this.handleBackButtonClick
    );
  }

  handleBackButtonClick() {
    if (this.state.stack.length > 0) {
      const { stack } = this.state;
      stack.pop();
      this.setState({
        type: stack.length > 0 ? stack[stack.length - 1] : "main",
        stack,
      });
      return true;
    } else {
      this.props.navigation.goBack();
      return true;
    }
  }
  requestPasswordOtp() {
    if (this.state.password.otpTime) {
      if (new Date() - this.state.password.otpTime < 60000) {
        this.setState({
          password: {
            ...this.state.password,
            loading: false,
            disabled: false,
            requestOtp: false,
          },
        });
        return alert(
          "You can request OTP again in " +
            Math.round(60 - (new Date() - this.state.password.otpTime) / 1000) +
            " seconds!"
        );
      }
    }
    if (
      !this.state.password.otpTime ||
      new Date() - this.state.password?.otpTime > 60000
    ) {
      this.setState({
        password: {
          ...this.state.password,
          loading: true,
          disabled: true,
          requestOtp: true,
        },
      });
      fetch(APIConstants.API_URL + "/accounts/otp/", {
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
          this.setState({
            password: {
              ...this.state.password,
              otp: true,
              loading: false,
              disabled: false,
              requestOtp: false,
              otpTime: new Date(),
            },
          });
        })
        .catch(() => {
          this.setState({
            password: {
              ...this.state.password,
              loading: false,
              disabled: false,
              requestOtp: false,
            },
          });
          alert("Failed to Request OTP!");
        });
    }
  }
  commonToggle(private_, req) {
    fetch(APIConstants.API_URL + "/accounts/profile/", {
      method: "PUT",
      headers: {
        Accept: "application/json",
        Authorization: "Token " + this.props.auth.token,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        [req]: private_,
      }),
    })
      .then((response) => {
        const statusCode = response.status;
        const data = response.json();
        return Promise.all([statusCode, data]);
      })
      .then(([statusCode, data]) => {
        this.props.setLoggedIn({
          state: true,
          token: this.props.auth.token,
          user: data.user,
        });
      })
      .catch(() => {});
  }
  savePassword() {
    fetch(APIConstants.API_URL + "/accounts/security/", {
      method: "PUT",
      headers: {
        Accept: "application/json",
        Authorization: "Token " + this.props.auth.token,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        [this.state.password.otp ? "otp" : "password"]: this.state.password
          .password,
        passwordNew: this.state.password.passwordNew,
      }),
    })
      .then((response) => {
        const statusCode = response.status;
        const data = response.json();
        return Promise.all([statusCode, data]);
      })
      .then(([statusCode, data]) => {
        if (statusCode === 200) {
          this.setState({
            password: {
              password: "",
              passwordConfirm: "",
              passwordNew: "",
              passSecure: true,
              passSecureNew: true,
              passSecureConfirm: true,
              errors: { password: "", passwordNew: "", passwordConfirm: "" },
              loading: false,
              disabled: false,
              otp: false,
            },
          });
          alert("Password Changed!");
        }
      })
      .catch(() => {
        this.setState({
          password: {
            ...this.state.password,
            password: "",
            errors: {
              password: this.state.password.otp
                ? "Invalid OTP"
                : "Invalid Password",
            },
            loading: false,
            disabled: false,
          },
        });
      });
  }
  render() {
    const SButton = (props) => (
      <Ripple
        style={{ padding: 10 }}
        onPress={() => (props.onPress ? props.onPress() : {})}>
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
                tintColor: "#555",
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
                borderColor: "#555",
              }}
              resizeMode="cover"
            />
          ) : null}
          <Text category="h6">{props.text}</Text>
        </Layout>
      </Ripple>
    );
    const AlertIcon = (props) => (
      <Icon {...props} name="alert-circle-outline" />
    );
    const type = this.state.type;
    return (
      <SafeAreaView>
        <Layout
          style={{
            width: "100%",
            height: 50,
            justifyContent: "space-between",
            alignItems: "center",
            flexDirection: "row",
            paddingRight: 10,
            paddingLeft: 10,
            elevation: 2,
          }}>
          <Layout
            style={{
              flexDirection: "row",
              justifyContent: "center",
              alignItems: "center",
            }}>
            <Ripple
              style={{ padding: 10 }}
              onPress={() => this.handleBackButtonClick()}>
              <Icon
                name="arrow-back-outline"
                style={{
                  width: 27,
                  height: 27,
                  tintColor: "black",
                }}
              />
            </Ripple>
            <Text style={{ fontSize: 18, padding: 10 }}>
              {type === "security"
                ? "Security Settings"
                : type === "privacy"
                ? "Privacy Settings"
                : type === "account"
                ? "Account Settings"
                : type === "help"
                ? "Help"
                : type === "about"
                ? "About"
                : type === "logins"
                ? "Account Logins"
                : type === "password"
                ? "Change Password"
                : "Settings"}
            </Text>
          </Layout>
        </Layout>
        <ScrollView style={{ backgroundColor: "transparent" }}>
          {type === "security" ? (
            <Layout
              style={{ backgroundColor: "transparent", paddingHorizontal: 10 }}>
              <SButton
                icon="lock-outline"
                text="Password"
                onPress={() => {
                  this.setState({
                    type: "password",
                    stack: [...this.state.stack, "password"],
                  });
                }}
              />
              <SButton
                icon="options-2-outline"
                text="Account Logins"
                onPress={() => {
                  fetch(APIConstants.API_URL + "/accounts/login-history/", {
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
                      this.setState({
                        loginHistory: {
                          data: data.history.reverse(),
                          loading: false,
                        },
                      });
                    })
                    .catch(() => {});
                  this.setState({
                    type: "logins",
                    stack: [...this.state.stack, "logins"],
                  });
                }}
              />
            </Layout>
          ) : type === "password" ? (
            <Layout
              style={{
                backgroundColor: "transparent",
                paddingHorizontal: 10,
                paddingTop: 10,
              }}>
              {this.state.password.otp ? (
                <Input
                  caption={this.state.password.errors.password}
                  captionIcon={
                    this.state.password.errors.password ? AlertIcon : false
                  }
                  status={
                    this.state.password.errors.password ? "danger" : "basic"
                  }
                  disabled={this.state.password.disabled}
                  placeholder="OTP"
                  maxLength={6}
                  keyboardType="numeric"
                  value={this.state.password.password}
                  onChangeText={(nextValue) => {
                    if (
                      nextValue.trim().match(/[0-9]+/) ||
                      nextValue.trim() === ""
                    )
                      this.setState({
                        password: {
                          ...this.state.password,
                          password: nextValue.trim(),
                          errors: {
                            ...this.state.password.errors,
                            password: "",
                          },
                        },
                      });
                  }}
                  returnKeyType={"next"}
                  accessoryRight={(props) => (
                    <TouchableWithoutFeedback
                      onPress={() => {
                        this.setState({
                          password: {
                            ...this.state.password,
                            passSecure: !this.state.password.passSecure,
                          },
                        });
                      }}>
                      <Icon
                        {...props}
                        name={
                          this.state.password.passSecure ? "eye-off" : "eye"
                        }
                      />
                    </TouchableWithoutFeedback>
                  )}
                  onSubmitEditing={() => {
                    this.passwordNewInput.focus();
                  }}
                  style={{ marginBottom: 5 }}
                  secureTextEntry={this.state.password.passSecure}
                />
              ) : (
                <Input
                  caption={this.state.password.errors.password}
                  captionIcon={
                    this.state.password.errors.password ? AlertIcon : false
                  }
                  status={
                    this.state.password.errors.password ? "danger" : "basic"
                  }
                  disabled={this.state.password.disabled}
                  placeholder="Old Password"
                  value={this.state.password.password}
                  onChangeText={(nextValue) => {
                    this.setState({
                      password: {
                        ...this.state.password,
                        password: nextValue.trim(),
                        errors: {
                          ...this.state.password.errors,
                          password: "",
                        },
                      },
                    });
                  }}
                  returnKeyType={"next"}
                  accessoryRight={(props) => (
                    <TouchableWithoutFeedback
                      onPress={() => {
                        this.setState({
                          password: {
                            ...this.state.password,
                            passSecure: !this.state.password.passSecure,
                          },
                        });
                      }}>
                      <Icon
                        {...props}
                        name={
                          this.state.password.passSecure ? "eye-off" : "eye"
                        }
                      />
                    </TouchableWithoutFeedback>
                  )}
                  onSubmitEditing={() => {
                    this.passwordNewInput.focus();
                  }}
                  style={{ marginBottom: 5 }}
                  secureTextEntry={this.state.password.passSecure}
                />
              )}
              <Input
                caption={this.state.password.errors.passwordNew}
                captionIcon={
                  this.state.password.errors.passwordNew ? AlertIcon : false
                }
                status={
                  this.state.password.errors.passwordNew ? "danger" : "basic"
                }
                disabled={this.state.password.disabled}
                ref={(input) => {
                  this.passwordNewInput = input;
                }}
                returnKeyType={"next"}
                placeholder="New Password"
                value={this.state.password.passwordNew}
                onChangeText={(nextValue) => {
                  if (
                    !nextValue
                      .trim()
                      .match(
                        /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[^a-zA-Z0-9])(?!.*\s).{8,15}$/
                      )
                  ) {
                    this.setState({
                      password: {
                        ...this.state.password,
                        passwordNew: nextValue.trim(),
                        errors: {
                          ...this.state.password.errors,
                          passwordNew:
                            "Password Must Follow have atleast:\n one lowercase letter, one uppercase letter,\n one numeric digit, and one special character\n and length between 8-15",
                        },
                      },
                    });
                  } else {
                    this.setState({
                      password: {
                        ...this.state.password,
                        passwordNew: nextValue.trim(),
                        errors: {
                          ...this.state.password.errors,
                          passwordNew: "",
                        },
                      },
                    });
                  }
                }}
                accessoryRight={(props) => (
                  <TouchableWithoutFeedback
                    onPress={() => {
                      this.setState({
                        password: {
                          ...this.state.password,
                          passSecureNew: !this.state.password.passSecureNew,
                        },
                      });
                    }}>
                    <Icon
                      {...props}
                      name={
                        this.state.password.passSecureNew ? "eye-off" : "eye"
                      }
                    />
                  </TouchableWithoutFeedback>
                )}
                onSubmitEditing={() => {
                  this.passwordConfirmInput.focus();
                }}
                style={{ marginBottom: 5 }}
                secureTextEntry={this.state.password.passSecureNew}
              />
              <Input
                caption={this.state.password.errors.passwordConfirm}
                captionIcon={
                  this.state.password.errors.passwordConfirm ? AlertIcon : false
                }
                status={
                  this.state.password.errors.passwordConfirm
                    ? "danger"
                    : "basic"
                }
                disabled={this.state.password.disabled}
                ref={(input) => {
                  this.passwordConfirmInput = input;
                }}
                placeholder="Confirm Password"
                value={this.state.password.passwordConfirm}
                onChangeText={(nextValue) => {
                  if (nextValue.trim() != this.state.password.passwordNew) {
                    this.setState({
                      password: {
                        ...this.state.password,
                        passwordConfirm: nextValue.trim(),
                        errors: {
                          ...this.state.password.errors,
                          passwordConfirm: "Passwords Don't Match!",
                        },
                      },
                    });
                  } else {
                    this.setState({
                      password: {
                        ...this.state.password,
                        passwordConfirm: nextValue.trim(),
                        errors: {
                          ...this.state.password.errors,
                          passwordConfirm: "",
                        },
                      },
                    });
                  }
                }}
                accessoryRight={(props) => (
                  <TouchableWithoutFeedback
                    onPress={() => {
                      this.setState({
                        password: {
                          ...this.state.password,
                          passSecureConfirm: !this.state.password
                            .passSecureConfirm,
                        },
                      });
                    }}>
                    <Icon
                      {...props}
                      name={
                        this.state.password.passSecureConfirm
                          ? "eye-off"
                          : "eye"
                      }
                    />
                  </TouchableWithoutFeedback>
                )}
                onSubmitEditing={() => {
                  this.savePassword();
                }}
                style={{ marginBottom: 5 }}
                secureTextEntry={this.state.password.passSecureConfirm}
              />
              <Button
                // style={styles.Button}
                disabled={
                  !(
                    this.state.password.errors.password === "" ||
                    this.state.password.errors.passwordNew === "" ||
                    this.state.password.errors.passwordConfirm === ""
                  ) ||
                  this.state.password.password === "" ||
                  this.state.password.passwordNew === "" ||
                  this.state.password.passwordConfirm === ""
                }
                onPress={
                  this.state.password.loading
                    ? () => {
                        // this.setState({
                        //   password: {
                        //     ...this.state.password,
                        //     loading: false,
                        //     disabled: false,
                        //   },
                        // });
                      }
                    : () => {
                        this.savePassword();
                        this.setState({
                          password: {
                            ...this.state.password,
                            loading: true,
                            disabled: true,
                          },
                        });
                      }
                }
                appearance={this.state.password.loading ? "outline" : "filled"}
                accessoryLeft={
                  this.state.password.loading
                    ? (props) => (
                        <View style={[props.style]}>
                          <Spinner size="small" />
                        </View>
                      )
                    : null
                }>
                {this.state.password.loading
                  ? "Please Wait..."
                  : "Change Password"}
              </Button>
              <Ripple
                onPress={() => {
                  this.requestPasswordOtp();
                }}
                disabled={this.state.password.requestOtp}
                style={{
                  padding: 10,
                  justifyContent: "center",
                  alignItems: "center",
                  marginTop: 10,
                }}>
                <Text appearance="hint">
                  {this.state.password.requestOtp
                    ? "Requesting OTP..."
                    : this.state.password.otp
                    ? "Request OTP again"
                    : "Forgot Password?"}
                </Text>
              </Ripple>
            </Layout>
          ) : type === "logins" ? (
            <Layout
              style={{ backgroundColor: "transparent", paddingHorizontal: 10 }}>
              <Text category="h6" style={{ padding: 10 }}>
                Account Login History
              </Text>
              {this.state.loginHistory.loading && (
                <Layout
                  style={{ justifyContent: "center", alignItems: "center" }}>
                  <Spinner />
                </Layout>
              )}
              <FlatList
                data={this.state.loginHistory.data}
                keyExtractor={({ item, index }) => index}
                ListEmptyComponent={
                  <Layout>
                    <Text>No Login History!</Text>
                  </Layout>
                }
                renderItem={({ item, index }) => (
                  <DeviceHistory item={item} key={index} />
                )}
              />
            </Layout>
          ) : type === "help" ? (
            <Layout
              style={{ backgroundColor: "transparent", paddingHorizontal: 10 }}>
              <SButton text="Report a Problem" />
              <SButton text="Help Center" />
              <SButton text="F.A.Q." />
            </Layout>
          ) : type === "comments" ? (
            <Layout
              style={{ backgroundColor: "transparent", paddingHorizontal: 10 }}>
              <Layout
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                  backgroundColor: "transparent",
                  padding: 10,
                }}>
                <Text category="h6">Private Comments</Text>
                <Toggle
                  checked={this.state.privateComments}
                  onChange={() => {
                    this.commonToggle(
                      !this.state.privateComments,
                      "privateComments"
                    );
                    this.setState({
                      privateComments: !this.state.privateComments,
                    });
                  }}
                />
              </Layout>
              <Text appearance="hint" style={{ padding: 15 }}>
                By Allowing Private Comments:{"\n"}
                <Text appearance="hint" style={{ fontSize: 12, padding: 5 }}>
                  Your Followers can post Private Comments
                  {"\n"}These Comments will be Visible Only to You & Accounts
                  Tagged in Mopic
                </Text>
              </Text>
            </Layout>
          ) : type === "rating" ? (
            <Layout
              style={{ backgroundColor: "transparent", paddingHorizontal: 10 }}>
              <Layout
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                  backgroundColor: "transparent",
                  padding: 10,
                }}>
                <Text category="h6">Rating Visiblity</Text>
                <Toggle
                  checked={this.state.rating}
                  onChange={() => {
                    this.commonToggle(!this.state.rating, "rating");
                    this.setState({
                      rating: !this.state.rating,
                    });
                  }}
                />
              </Layout>
              <Text appearance="hint" style={{ padding: 15 }}>
                By Turning Rating Visiblity On :{"\n"}
                <Text appearance="hint" style={{ fontSize: 12, padding: 5 }}>
                  Your Followers can view Individual Users Ratings
                </Text>
              </Text>
            </Layout>
          ) : type === "lastseen" ? (
            <Layout
              style={{ backgroundColor: "transparent", paddingHorizontal: 10 }}>
              <Layout
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                  backgroundColor: "transparent",
                  padding: 10,
                }}>
                <Text category="h6">Last Seen</Text>
                <Toggle
                  checked={this.state.lastseen}
                  onChange={() => {
                    this.commonToggle(!this.state.lastseen, "lastseen");
                    this.setState({
                      lastseen: !this.state.lastseen,
                    });
                  }}
                />
              </Layout>
              <Text appearance="hint" style={{ fontSize: 12, padding: 15 }}>
                Last Seen is the time you when you were last active{"\n"}This is
                Available in Messages
              </Text>
            </Layout>
          ) : type === "private" ? (
            <Layout
              style={{ backgroundColor: "transparent", paddingHorizontal: 10 }}>
              <Layout
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                  backgroundColor: "transparent",
                  padding: 10,
                }}>
                <Text category="h6">Account Private</Text>
                <Toggle
                  checked={this.state.private}
                  onChange={() => {
                    this.commonToggle(!this.state.private, "private");
                    this.setState({ private: !this.state.private });
                  }}
                />
              </Layout>
              {this.state.private ? (
                <Text appearance="hint" style={{ padding: 15 }}>
                  Private Account Privilages:{"\n"}
                  <Text appearance="hint" style={{ fontSize: 12, padding: 5 }}>
                    Only your Followers can interact with your Mopics
                    {"\n"}You will Receive Request if Someone wants to Follow
                    you
                    {"\n"}Some Private Features will be available
                  </Text>
                </Text>
              ) : (
                <Text appearance="hint" style={{ padding: 15 }}>
                  Public Account Privilages:{"\n"}
                  <Text appearance="hint" style={{ fontSize: 12, padding: 5 }}>
                    Anyone can interact with your Mopics
                    {"\n"}Extra Achievement Trophies will be Available
                    {"\n"}You can Request for Account Verification
                  </Text>
                </Text>
              )}
            </Layout>
          ) : type === "profilepic" ? (
            <Layout
              style={{ backgroundColor: "transparent", paddingHorizontal: 10 }}>
              <Ripple
                onPress={() => {
                  this.props.navigation.navigate("ProfileImageScreen", {
                    type: "primary",
                  });
                }}>
                <Layout
                  style={{
                    padding: 10,
                    flexDirection: "row",
                    justifyContent: "flex-start",
                    alignItems: "center",
                    backgroundColor: "transparent",
                  }}>
                  <Image
                    source={{ uri: this.props.auth.user.profile.image }}
                    style={{
                      width: 70,
                      height: 70,
                      borderRadius: 70,
                      borderWidth: 1,
                    }}
                    resizeMode="cover"
                  />
                  <Layout
                    style={{ marginLeft: 10, backgroundColor: "transparent" }}>
                    <Text category="h6">Edit Profile Picture</Text>
                    <Text
                      appearance="hint"
                      style={{ fontSize: 11, width: "80%" }}>
                      {this.props.auth.user.profile.private
                        ? "This image will be appear only your followers"
                        : "This image will visible to all"}
                    </Text>
                  </Layout>
                </Layout>
              </Ripple>
              {this.props.auth.user.profile.private && (
                <Ripple
                  onPress={() =>
                    this.props.navigation.navigate("ProfileImageScreen", {
                      type: "secondary",
                    })
                  }>
                  <Layout
                    style={{
                      padding: 10,
                      flexDirection: "row",
                      justifyContent: "flex-start",
                      alignItems: "center",
                      backgroundColor: "transparent",
                    }}>
                    <Image
                      source={{
                        uri: this.props.auth.user.profile.image_secondary,
                      }}
                      style={{
                        width: 70,
                        height: 70,
                        borderRadius: 70,
                        borderWidth: 1,
                      }}
                      resizeMode="cover"
                    />
                    <Layout
                      style={{
                        marginLeft: 10,
                        backgroundColor: "transparent",
                      }}>
                      <Text category="h6">Edit Secondary Profile Picture</Text>
                      <Text
                        appearance="hint"
                        style={{ fontSize: 11, width: "80%" }}>
                        {!this.props.auth.user.profile.private
                          ? ""
                          : "This image will visible to users who does not follow you "}
                      </Text>
                    </Layout>
                  </Layout>
                </Ripple>
              )}
            </Layout>
          ) : type === "blockedacc" ? (
            <Layout
              style={{
                backgroundColor: "transparent",
                paddingHorizontal: 10,
              }}>
              <UserObj />
            </Layout>
          ) : type === "about" ? (
            <Layout
              style={{ backgroundColor: "transparent", paddingHorizontal: 10 }}>
              <Layout
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}>
                <SButton text="App Version" />
                <Text appearance="hint">{Constants.nativeAppVersion}</Text>
              </Layout>
              <SButton text="App Updates" />
              <SButton text="Data Policy" />
              <SButton text="Privacy Policy" />
              <SButton text="Terms of Use" />
              <SButton text="Open Source Libraries" />
            </Layout>
          ) : type === "account" ? (
            <Layout
              style={{ backgroundColor: "transparent", paddingHorizontal: 10 }}>
              <SButton
                onPress={() => {
                  this.props.navigation.navigate("MopicLiked");
                }}
                icon="heart-outline"
                text="Liked Mopics"
              />
              <SButton
                onPress={() => {
                  this.props.navigation.navigate("SelfRatings");
                }}
                icon="star-outline"
                text="Ratings Summary by you"
              />
              <SButton
                onPress={() =>
                  Alert.alert("", "Verification is not Available now!")
                }
                icon="checkmark-circle-outline"
                text="Request Account Verification"
              />
              <SButton icon="clock-outline" text="Account Deactivation" />
            </Layout>
          ) : type === "privacy" ? (
            <Layout
              style={{
                backgroundColor: "transparent",
                paddingHorizontal: 10,
                paddingTop: 10,
              }}>
              <SButton
                icon="lock-outline"
                text="Private Account"
                onPress={() => {
                  this.setState({
                    type: "private",
                    stack: [...this.state.stack, "private"],
                  });
                }}
              />
              <SButton
                icon="message-circle-outline"
                text="Comments"
                onPress={() => {
                  this.setState({
                    type: "comments",
                    stack: [...this.state.stack, "comments"],
                  });
                }}
              />
              <SButton
                icon="star-outline"
                text="Rating"
                onPress={() => {
                  this.setState({
                    type: "rating",
                    stack: [...this.state.stack, "rating"],
                  });
                }}
              />
              <SButton
                icon="person-done-outline"
                text="Last Seen"
                onPress={() => {
                  this.setState({
                    type: "lastseen",
                    stack: [...this.state.stack, "lastseen"],
                  });
                }}
              />
              <SButton
                icon="person-outline"
                text="Profile Picture"
                onPress={() => {
                  if (!this.props.auth.user.profile.private) {
                    this.props.navigation.navigate("ProfileImageScreen", {
                      type: "primary",
                    });
                  } else
                    this.setState({
                      type: "profilepic",
                      stack: [...this.state.stack, "profilepic"],
                    });
                }}
              />
              <SButton
                icon="close-circle-outline"
                text="Blocked Accounts"
                onPress={() => {
                  this.setState({
                    type: "blockedacc",
                    stack: [...this.state.stack, "blockedacc"],
                  });
                }}
              />
            </Layout>
          ) : (
            <Layout
              style={{ backgroundColor: "transparent", paddingHorizontal: 10 }}>
              <SButton
                icon="person-add-outline"
                onPress={async () => {
                  try {
                    setTimeout(async () => {
                      const result = await Share.share({
                        message: "Morvii Invite Link From Nitesh",
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
                    }, 300);
                  } catch (error) {
                    alert(error.message);
                  }
                }}
                text="Invite Friends"
              />
              <SButton
                icon="shield-outline"
                text="Security"
                onPress={() => {
                  this.setState({
                    type: "security",
                    stack: [...this.state.stack, "security"],
                  });
                }}
              />
              <SButton
                icon="lock-outline"
                text="Privacy"
                onPress={() => {
                  this.setState({
                    type: "privacy",
                    stack: [...this.state.stack, "privacy"],
                  });
                }}
              />
              <SButton
                icon="person-outline"
                text="Account"
                onPress={() => {
                  this.setState({
                    type: "account",
                    stack: [...this.state.stack, "account"],
                  });
                }}
              />
              <SButton
                icon="question-mark-circle-outline"
                text="Help"
                onPress={() => {
                  this.setState({
                    type: "help",
                    stack: [...this.state.stack, "help"],
                  });
                }}
              />
              <SButton
                icon="info-outline"
                text="About"
                onPress={() => {
                  this.setState({
                    type: "about",
                    stack: [...this.state.stack, "about"],
                  });
                }}
              />
              <SButton icon="log-out-outline" text="Logout" />
            </Layout>
          )}
          {/* <Footer /> */}
        </ScrollView>
      </SafeAreaView>
    );
  }
}
const mapStateToProps = (state) => ({
  auth: state.secure.auth,
});
export default connect(mapStateToProps, { setLoggedIn })(SettingsScreen);
