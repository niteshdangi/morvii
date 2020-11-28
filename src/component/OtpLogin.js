import * as React from "react";
import { connect } from "react-redux";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  Button,
  Divider,
  Layout,
  TopNavigation,
  Text,
  Input,
  Icon,
  Spinner,
  RadioGroup,
  Radio,
  CheckBox,
} from "@ui-kitten/components";
import * as Constants from "./Constants";
import { setLocked, setLoggedIn } from "../actions/loginAction";
import { Animated, Image, StyleSheet, ToastAndroid, View } from "react-native";
import { TouchableWithoutFeedback } from "@ui-kitten/components/devsupport";
import * as Device from "expo-device";
import Ripple from "react-native-material-ripple";
import { Modalize } from "react-native-modalize";
import { LockTimer } from "./Login";
class ResetTimer extends React.PureComponent {
  state = { seconds: 60 };
  timer = null;
  componentDidMount() {
    this.timer = setInterval(() => {
      var timer = this.state.seconds;
      if (timer > 0) {
        this.setState({ seconds: timer - 1 });
      } else {
        this.props.setResend(true);
        clearInterval(this.timer);
      }
    }, 1000);
  }
  componentWillUnmount() {
    clearInterval(this.timer);
  }
  render() {
    return (
      <Text
        style={{
          textAlign: "left",
          width: "100%",
          fontSize: 12,
          color: "blue",
          padding: 5,
        }}>
        Resend OTP in {this.state.seconds} seconds
      </Text>
    );
  }
}
const OtpLogin = ({ navigation, setLoggedIn, locked, setLocked, route }) => {
  const isLoginScreen = route?.params?.login;
  const [secureTextEntry, setSecureTextEntry] = React.useState(true);
  const [loading, setLoading] = React.useState(false);
  const [passwordReset, setPasswordReset] = React.useState(false);
  const [MainError, setMainError] = React.useState("");
  const [email, setEmail] = React.useState(null);
  const [mobile, setMobile] = React.useState(null);
  const [verifying, setVerifying] = React.useState(false);
  const [autoLogin, setAutoLogin] = React.useState(true);
  const [resend, setResend] = React.useState(false);
  const [helpHeight, setHelpHeight] = React.useState(46.8);
  const LockedAccounts = locked;
  const bottomAnim = new Animated.Value(0);
  const modal = React.useRef();
  const bottomAnim_1 = () => {
    Animated.timing(bottomAnim, {
      toValue: 1,
      duration: 1000,
      delay: 5000,
      useNativeDriver: true,
    }).start(bottomAnim_0);
  };
  const bottomAnim_0 = () => {
    Animated.timing(bottomAnim, {
      toValue: 0,
      duration: 1500,
      delay: 5500,
      useNativeDriver: true,
    }).start(bottomAnim_1);
  };
  bottomAnim_0();
  const [values, setValues] = React.useState({
    username: "",
    password: "",
    token: "",
  });
  const [passes, setPasses] = React.useState({
    confirm: "",
    password: "",
  });
  const [errors, setErrors] = React.useState({ username: "", password: "" });
  var usernameInput = React.useRef();
  var passwordInput = React.useRef();
  const toggleSecureEntry = () => {
    setSecureTextEntry(!secureTextEntry);
  };
  const deviceDetails = JSON.stringify({
    isDevice: Device.isDevice,
    manufacturer: Device.manufacturer,
    modelName: Device.modelName,
    osName: Device.osName,
    osVersion: Device.osVersion,
    deviceName: Device.deviceName,
  });
  const Login = (otp = values.password) => {
    if (!values.username) {
      setErrors({ ...errors, username: "Username is Required!" });
    } else if (!values.password && !otp) {
      setErrors({ ...errors, password: "OTP is Required!" });
    } else {
      setMainError("");
      setErrors({ username: "", password: "" });
      setVerifying(true);
      setTimeout(() => {
        fetch(Constants.API_URL + "/accounts/login/otp/", {
          method: "POST",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ ...values, password: otp, deviceDetails }),
        })
          .then((response) => {
            const statusCode = response.status;
            const data = response.json();
            return Promise.all([statusCode, data]);
          })
          .then(([statusCode, data]) => {
            if (statusCode === 200) {
              if (data.token) {
                setLoggedIn({
                  state: true,
                  token: data.token,
                  user: data.user,
                });
                navigation.replace("BaseApp");
              } else {
                setMainError(
                  "Failed to Login! Please Try again after Sometime!"
                );
              }
            } else if (statusCode === 400) {
              setMainError("Invalid OTP");
            } else {
              setMainError(data.detail);
              if (data?.locked) {
                setMobile(null);
                setEmail(null);
                setLocked({ username: values.username, date: new Date() });
              }
            }
            setVerifying(false);
          })
          .catch((error) => {
            setMainError(error + ""); // setMainError("Something went wrong! Please Try Again");
            setVerifying(false);
          });
      }, 0);
    }
  };

  const Password = (otp = values.password) => {
    if (!values.username) {
      setErrors({ ...errors, username: "Username is Required!" });
    } else if (!values.password && !otp) {
      setErrors({ ...errors, password: "OTP is Required!" });
    } else {
      setMainError("");
      setErrors({ username: "", password: "" });
      setVerifying(true);
      setTimeout(() => {
        fetch(Constants.API_URL + "/accounts/reset/password/otp/", {
          method: "POST",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ ...values, password: otp }),
        })
          .then((response) => {
            const statusCode = response.status;
            const data = response.json();
            return Promise.all([statusCode, data]);
          })
          .then(([statusCode, data]) => {
            if (statusCode === 200) {
              if (data.token) {
                setValues({ ...values, token: data.token });
                setPasswordReset(true);
              } else {
                setMainError(
                  "Failed to Verify! Please Try again after Sometime!"
                );
              }
            } else if (statusCode === 400) {
              setMainError("Invalid OTP");
            } else {
              setMainError(data.detail);
              if (data?.locked) {
                setMobile(null);
                setEmail(null);
                setLocked({ username: values.username, date: new Date() });
              }
            }
            setVerifying(false);
          })
          .catch((error) => {
            setMainError(error + ""); // setMainError("Something went wrong! Please Try Again");
            setVerifying(false);
          });
      }, 0);
    }
  };
  const onPress = () => {
    if (!values.username) {
      setErrors({ ...errors, username: "Username is Required!" });
    } else {
      setMainError("");
      setErrors({ username: "", password: "" });
      setLoading(true);
      setTimeout(() => {
        fetch(Constants.API_URL + "/accounts/login/otp/request/", {
          method: "POST",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ username: values.username }),
        })
          .then((response) => {
            const statusCode = response.status;
            const data = response.json();
            return Promise.all([statusCode, data]);
          })
          .then(([statusCode, data]) => {
            if (statusCode === 200) {
              setEmail(data.email);
              setMobile(data.mobile);
              setValues({ ...values, token: data.token });
              setResend(false);
              if (!data.email && !data.mobile) {
                setMainError(
                  "Account have no mobile or email linked\nThis Account may be removed if mobile/email not set!"
                );
              } else if (data?.attempts == 9) {
                setMainError("OPT Login will locked after next Request!");
              }
            } else if (statusCode === 400) {
              setMainError("Invalid Username or Password!");
            } else {
              setMainError(data.detail);
              if (data?.locked) {
                setMobile(null);
                setEmail(null);
                setLocked({ username: values.username, date: new Date() });
              }
            }
            setLoading(false);
          })
          .catch((error) => {
            setMainError(error + ""); // setMainError("Something went wrong! Please Try Again");
            setLoading(false);
          });
      }, 0);
    }
  };
  const ResetPassword = () => {
    if (!passes.password) {
      setErrors({ ...errors, username: "Password is Required!" });
    } else {
      setMainError("");
      setErrors({ username: "", password: "" });
      setVerifying(true);
      setTimeout(() => {
        fetch(Constants.API_URL + "/accounts/reset/password/", {
          method: "POST",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ...values,
            password: passes.password,
            login: autoLogin,
          }),
        })
          .then((response) => {
            const statusCode = response.status;
            const data = response.json();
            return Promise.all([statusCode, data]);
          })
          .then(([statusCode, data]) => {
            if (statusCode === 200) {
              ToastAndroid.show("Password Changed", ToastAndroid.LONG);
              if (data.token) {
                setLoggedIn({
                  state: true,
                  token: data.token,
                  user: data.user,
                });
                navigation.replace("BaseApp");
              } else {
                navigation.replace("Login");
              }
            } else if (statusCode === 400) {
              setMainError("Invalid OTP");
            } else {
              setMainError(data.detail);
              if (data?.locked) {
                setMobile(null);
                setEmail(null);
                setLocked({ username: values.username, date: new Date() });
              }
            }
            setVerifying(false);
          })
          .catch((error) => {
            setMainError(error + ""); // setMainError("Something went wrong! Please Try Again");
            setVerifying(false);
          });
      }, 0);
    }
  };
  const LoadingIndicator = (props) => (
    <View style={[props.style, styles.indicator]}>
      <Spinner size="small" />
    </View>
  );

  const checkLocked = () => {
    if (LockedAccounts?.[values.username]) {
      if (new Date() - new Date(LockedAccounts?.[values.username]) < 3600000) {
        return false;
      }
      setLocked({ username: values.username, date: undefined });
    }
    return false;
  };

  const renderIcon = (props) => (
    <TouchableWithoutFeedback onPress={toggleSecureEntry}>
      <Icon {...props} name={secureTextEntry ? "eye-off" : "eye"} />
    </TouchableWithoutFeedback>
  );
  const AlertIcon = (props) => <Icon {...props} name="alert-circle-outline" />;
  return (
    <Layout style={{ flex: 1 }}>
      <Image
        source={require("../../assets/logo.png")}
        style={{
          height: 250,
          width: 250,
          position: "absolute",
          zIndex: 1,
          right: -50,
          top: -50,
        }}
        resizeMode="contain"
      />
      <Layout
        style={{
          alignItems: "flex-start",
          justifyContent: "center",
          zIndex: 0,
        }}>
        <Image
          source={require("../../assets/brandName.png")}
          style={{ height: 120, width: 200 }}
          resizeMode="contain"
        />
      </Layout>
      <Layout style={styles.Layout}>
        <Text
          category="h1"
          style={{
            textAlign: "left",
            marginBottom: 50,
            marginTop: -50,
            paddingLeft: 30,
            width: "100%",
          }}>
          {isLoginScreen ? "Welcome back" : "Reset Password"}
        </Text>
        {isLoginScreen && (
          <Text
            category="h6"
            style={{
              textAlign: "left",
              marginBottom: 50,
              marginTop: -40,
              paddingLeft: 30,
              width: "100%",
            }}>
            We missed you ❤
          </Text>
        )}
        <Layout style={{ width: "90%", maxWidth: 500 }}>
          <Layout style={{ alignItems: "center", justifyContent: "center" }}>
            {passwordReset ? (
              <>
                <Input
                  caption={errors.username}
                  captionIcon={errors.username ? AlertIcon : false}
                  status={errors.username ? "danger" : "basic"}
                  disabled={loading}
                  ref={(input) => {
                    usernameInput = input;
                  }}
                  placeholder="New Password"
                  value={passes.password}
                  onChangeText={(nextValue) => {
                    if (
                      !nextValue
                        .trim()
                        .match(
                          /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[^a-zA-Z0-9])(?!.*\s).{8,15}$/
                        )
                    ) {
                      setErrors({
                        ...errors,
                        username:
                          "Password Must Follow have atleast:\n one lowercase letter, one uppercase letter,\n one numeric digit, and one special character\n and length between 8-15",
                      });
                    } else setErrors({ ...errors, username: "" });
                    setPasses({ ...passes, password: nextValue.trim() });
                  }}
                  accessoryRight={renderIcon}
                  returnKeyType="next"
                  blurOnSubmit={false}
                  onSubmitEditing={() => {
                    passwordInput.focus();
                  }}
                  style={{ marginBottom: 5, fontFamily: "sans-serif" }}
                  secureTextEntry={secureTextEntry}
                />
                <Input
                  caption={errors.password}
                  captionIcon={errors.password ? AlertIcon : false}
                  status={errors.password ? "danger" : "basic"}
                  disabled={loading}
                  ref={(input) => {
                    passwordInput = input;
                  }}
                  placeholder="Confirm Password"
                  value={passes.confirm}
                  onChangeText={(nextValue) => {
                    setErrors({
                      ...errors,
                      password:
                        nextValue === passes.password
                          ? ""
                          : "Password's don't Match",
                    });
                    setPasses({ ...passes, confirm: nextValue.trim() });
                  }}
                  accessoryRight={renderIcon}
                  onSubmitEditing={ResetPassword}
                  style={{ marginBottom: 5, fontFamily: "sans-serif" }}
                  secureTextEntry={secureTextEntry}
                />
                <Layout
                  style={{
                    justifyContent: "flex-start",
                    alignItems: "flex-start",
                    width: "100%",
                    paddingBottom: 20,
                  }}>
                  <CheckBox
                    checked={autoLogin}
                    onChange={() => {
                      setAutoLogin(!autoLogin);
                    }}>
                    Login after reset?
                  </CheckBox>
                </Layout>
              </>
            ) : mobile || email ? (
              <Layout
                style={{
                  width: "100%",
                  justifyContent: "center",
                  alignItems: "flex-start",
                  padding: 10,
                  marginBottom: 20,
                }}>
                <Text
                  appearance="hint"
                  style={{ marginBottom: 10, marginLeft: -5 }}>
                  OTP sent to:
                </Text>
                {mobile ? <Text>Mobile No: {mobile}</Text> : null}
                {email ? <Text>Email ID:{email}</Text> : null}
              </Layout>
            ) : (
              <Input
                caption={errors.username}
                captionIcon={errors.username ? AlertIcon : false}
                disabled={loading}
                placeholder="Username"
                status={errors.username ? "danger" : "basic"}
                value={values.username}
                onChangeText={(nextValue) => {
                  setErrors({ ...errors, username: "" });
                  setValues({ ...values, username: nextValue.trim() });
                }}
                ref={usernameInput}
                returnKeyType={"done"}
                style={{ marginBottom: 5 }}
                blurOnSubmit={false}
                onSubmitEditing={() => {
                  onPress();
                }}
              />
            )}

            {MainError !== "" && (
              <Text
                style={{
                  textAlign: "left",
                  width: "100%",
                  fontSize: 12,
                  color: "red",
                  padding: 5,
                }}>
                {MainError}
              </Text>
            )}
            {checkLocked() && (
              <LockTimer
                otp={true}
                endTime={LockedAccounts?.[values.username]}
              />
            )}
            {passwordReset ? (
              <Button
                style={styles.Button}
                onPress={
                  verifying
                    ? () => {
                        //   setLoading(false);
                      }
                    : ResetPassword
                }
                disabled={
                  !passes.password.match(
                    /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[^a-zA-Z0-9])(?!.*\s).{8,15}$/
                  ) || passes.confirm !== passes.password
                }
                appearance={verifying ? "outline" : "filled"}
                accessoryLeft={verifying ? LoadingIndicator : null}>
                {verifying ? "Changing..." : "Change Password"}
              </Button>
            ) : mobile || email ? (
              <>
                {verifying ? (
                  <Button
                    style={styles.Button}
                    onPress={() => setVerifying(false)}
                    appearance={"outline"}
                    accessoryLeft={LoadingIndicator}>
                    Verifying OTP...
                  </Button>
                ) : (
                  <>
                    <Input
                      caption={errors.password}
                      captionIcon={errors.password ? AlertIcon : false}
                      disabled={loading}
                      placeholder="OTP"
                      status={errors.password ? "danger" : "basic"}
                      value={values.password}
                      onChangeText={(nextValue) => {
                        setErrors({ ...errors, password: "" });
                        setValues({ ...values, password: nextValue.trim() });
                        if (nextValue.length === 6) {
                          isLoginScreen
                            ? Login(nextValue)
                            : Password(nextValue);
                        }
                      }}
                      ref={passwordInput}
                      returnKeyType="done"
                      style={{
                        marginBottom: 5,
                        textAlign: "center",
                        letterSpacing: 50,
                      }}
                      blurOnSubmit={false}
                      maxLength={6}
                      keyboardType="number-pad"
                      onSubmitEditing={() => {
                        if (values.password.length === 6)
                          isLoginScreen ? Login() : Password();
                      }}
                    />
                    {resend ? (
                      <Button
                        style={styles.Button}
                        onPress={
                          loading
                            ? () => {
                                //   setLoading(false);
                              }
                            : onPress
                        }
                        appearance={loading ? "outline" : "filled"}
                        accessoryLeft={loading ? LoadingIndicator : null}>
                        {loading ? "Requesting OTP..." : "Request OTP"}
                      </Button>
                    ) : (
                      <ResetTimer setResend={setResend} />
                    )}
                  </>
                )}
              </>
            ) : (
              <Button
                style={styles.Button}
                onPress={
                  loading
                    ? () => {
                        //   setLoading(false);
                      }
                    : onPress
                }
                disabled={checkLocked()}
                appearance={loading ? "outline" : "filled"}
                accessoryLeft={loading ? LoadingIndicator : null}>
                {loading ? "Requesting OTP..." : "Request OTP"}
              </Button>
            )}
          </Layout>
          <Divider style={{ marginTop: 20 }} />

          <Layout style={{ alignItems: "center", justifyContent: "center" }}>
            <Button
              style={{ ...styles.Button }}
              disabled={loading}
              onPress={() => {
                navigation.navigate("Signup");
              }}
              appearance="ghost">
              Create a New Account
            </Button>
          </Layout>
        </Layout>
      </Layout>
      <Divider />
      <Ripple
        onPress={() => {
          modal.current?.open();
        }}
        style={{ alignItems: "center", justifyContent: "center" }}>
        <Animated.View
          style={{
            marginBottom: -helpHeight,
            opacity: bottomAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [1, 0],
            }),
          }}>
          <Button
            style={{ ...styles.Button, padding: 10 }}
            disabled={loading}
            appearance="ghost">
            <Text appearance="hint">Having trouble logging in? </Text> Forgot
            Login Details!
          </Button>
        </Animated.View>
        <Animated.View
          style={{ opacity: bottomAnim, backgroundColor: "#fff" }}
          onLayout={(e) => {
            setHelpHeight(e.nativeEvent.layout.height);
          }}>
          <Button
            style={{ ...styles.Button, padding: 10 }}
            disabled={loading}
            appearance="ghost">
            <Text appearance="hint">Having trouble logging in? </Text>
            Login with Password
          </Button>
        </Animated.View>
      </Ripple>
      <Modalize adjustToContentHeight ref={modal}>
        {isLoginScreen ? (
          <Button
            onPress={() => {
              navigation.navigate("OtpLogin", { login: false });
              modal.current.close();
              setEmail(null);
              setMobile(null);
              setPasses({ password: "", confirm: "" });
              setValues({ username: "", password: "", token: "" });
            }}
            style={{ ...styles.Button, padding: 20, height: 60 }}
            disabled={loading}
            appearance="ghost">
            Reset Password
          </Button>
        ) : (
          <Button
            onPress={() => {
              navigation.navigate("OtpLogin", { login: true });
              modal.current.close();
              setValues({ username: "", password: "", token: "" });
              setPasses({ password: "", confirm: "" });
              setPasswordReset(false);
              setEmail(null);
              setMobile(null);
            }}
            style={{ ...styles.Button, padding: 20, height: 60 }}
            disabled={loading}
            appearance="ghost">
            Login with OTP
          </Button>
        )}
        <Divider />
        <Button
          onPress={() => {
            navigation.replace("Login");
          }}
          style={{
            ...styles.Button,
            padding: 20,
            height: 60,
            marginBottom: 20,
          }}
          disabled={loading}
          appearance="ghost">
          Login with Password
        </Button>
      </Modalize>
    </Layout>
  );
};
const mapStateToProps = (state) => ({
  locked: state.secure.auth.locked,
});

export default connect(mapStateToProps, { setLoggedIn, setLocked })(OtpLogin);
const styles = StyleSheet.create({
  Layout: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 2,
    backgroundColor: "transparent",
  },
  Button: { width: "100%" },
});
