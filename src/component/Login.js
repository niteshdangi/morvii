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
} from "@ui-kitten/components";
import * as Constants from "./Constants";
import { setLocked, setLoggedIn } from "../actions/loginAction";
import { Animated, Image, StyleSheet, View } from "react-native";
import { TouchableWithoutFeedback } from "@ui-kitten/components/devsupport";
import * as Device from "expo-device";
import Ripple from "react-native-material-ripple";
import { Modalize } from "react-native-modalize";
export class LockTimer extends React.PureComponent {
  state = { timer: "59:00" };
  timer = null;
  componentDidMount() {
    this.timer = setInterval(() => {
      if (new Date() - new Date(this.props.endTime) < 3600000) {
        var timer = 3600000 - (new Date() - new Date(this.props.endTime));

        var seconds = timer / 1000;
        seconds = seconds % 3600;
        var minutes = parseInt(seconds / 60);
        minutes = minutes <= 0 ? "00" : minutes < 10 ? "0" + minutes : minutes;
        seconds = parseInt(seconds % 60);
        seconds = seconds <= 0 ? "00" : seconds < 10 ? "0" + seconds : seconds;

        this.setState({ timer: minutes + ":" + seconds });
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
          color: "red",
          padding: 5,
        }}>
        {this.props?.otp
          ? `OTP Login locked for ${this.state.timer} minutes`
          : `Account locked for ${this.state.timer} minutes`}
      </Text>
    );
  }
}
const LoginScreen = ({ navigation, setLoggedIn, locked, setLocked }) => {
  const [secureTextEntry, setSecureTextEntry] = React.useState(true);
  const [loading, setLoading] = React.useState(false);
  const [MainError, setMainError] = React.useState("");
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
  const [values, setValues] = React.useState({ username: "", password: "" });
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
  const onPress = () => {
    if (!values.username) {
      setErrors({ ...errors, username: "Username is Required!" });
    } else if (!values.password) {
      setErrors({ ...errors, password: "Password is Required!" });
    } else {
      setMainError("");
      setErrors({ username: "", password: "" });
      setLoading(true);
      setTimeout(() => {
        fetch(Constants.API_URL + "/accounts/login/", {
          method: "POST",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ ...values, deviceDetails }),
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
              setMainError("Invalid Username or Password!");
            } else {
              setMainError(data.detail);
              if (data?.attempts >= 10 || data?.cooloff_timedelta) {
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
  const renderIcon = (props) => (
    <TouchableWithoutFeedback onPress={toggleSecureEntry}>
      <Icon {...props} name={secureTextEntry ? "eye-off" : "eye"} />
    </TouchableWithoutFeedback>
  );
  const LoadingIndicator = (props) => (
    <View style={[props.style, styles.indicator]}>
      <Spinner size="small" />
    </View>
  );
  const checkLocked = () => {
    if (LockedAccounts?.[values.username]) {
      if (new Date() - new Date(LockedAccounts?.[values.username]) < 3600000) {
        return true;
      }
      setLocked({ username: values.username, date: undefined });
    }
    return false;
  };
  const AlertIcon = (props) => <Icon {...props} name="alert-circle-outline" />;
  return (
    <Layout style={{ flex: 1 }}>
      {/* <TopNavigation title="Login Page" alignment="center" />
      <Divider /> */}

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
          Welcome back
        </Text>
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
        <Layout style={{ width: "90%", maxWidth: 500 }}>
          <Layout style={{ alignItems: "center", justifyContent: "center" }}>
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
              returnKeyType={"next"}
              style={{ marginBottom: 5 }}
              blurOnSubmit={false}
              onSubmitEditing={() => {
                passwordInput.focus();
              }}
            />
            <Input
              caption={errors.password}
              captionIcon={errors.password ? AlertIcon : false}
              status={errors.password ? "danger" : "basic"}
              disabled={loading}
              ref={(input) => {
                passwordInput = input;
              }}
              placeholder="Password"
              value={values.password}
              onChangeText={(nextValue) => {
                setErrors({ ...errors, password: "" });
                setValues({ ...values, password: nextValue.trim() });
              }}
              accessoryRight={renderIcon}
              onSubmitEditing={onPress}
              style={{ marginBottom: 5, fontFamily: "sans-serif" }}
              secureTextEntry={secureTextEntry}
            />
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
              <LockTimer endTime={LockedAccounts?.[values.username]} />
            )}
            <Button
              style={styles.Button}
              onPress={
                loading
                  ? () => {
                      setLoading(false);
                    }
                  : onPress
              }
              disabled={checkLocked()}
              appearance={loading ? "outline" : "filled"}
              accessoryLeft={loading ? LoadingIndicator : null}>
              {checkLocked()
                ? "Account Locked"
                : loading
                ? "LOGGING YOU IN"
                : "LOGIN"}
            </Button>
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
            Login with OTP {"        "}
          </Button>
        </Animated.View>
      </Ripple>
      <Modalize adjustToContentHeight ref={modal}>
        <Button
          onPress={() => {
            navigation.navigate("OtpLogin", { login: false });
          }}
          style={{ ...styles.Button, padding: 20, height: 60 }}
          disabled={loading}
          appearance="ghost">
          Reset Password
        </Button>
        <Divider />
        <Button
          onPress={() => {
            navigation.navigate("OtpLogin", { login: true });
          }}
          style={{
            ...styles.Button,
            padding: 20,
            height: 60,
            marginBottom: 20,
          }}
          disabled={loading}
          appearance="ghost">
          Login with OTP
        </Button>
      </Modalize>
    </Layout>
  );
};
const mapStateToProps = (state) => ({
  locked: state.secure.auth.locked,
});

export default connect(mapStateToProps, { setLoggedIn, setLocked })(
  LoginScreen
);
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
