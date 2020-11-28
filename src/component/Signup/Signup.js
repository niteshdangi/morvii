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
import * as Constants from "../Constants";
import PhoneInput from "react-native-phone-input";
import { setLocked, setLoggedIn } from "../../actions/loginAction";
import {
  Animated,
  BackHandler,
  Dimensions,
  Image,
  StyleSheet,
  View,
} from "react-native";
import { TouchableWithoutFeedback } from "@ui-kitten/components/devsupport";
import * as Device from "expo-device";
import Ripple from "react-native-material-ripple";
import { Modalize } from "react-native-modalize";
import { ScrollView } from "react-native-gesture-handler";
class CountryModal extends React.PureComponent {
  open() {
    this.modal?.open();
  }
  close() {
    this.modal?.close();
  }
  render() {
    return (
      <Modalize
        HeaderComponent={
          <Layout
            style={{
              paddingHorizontal: 15,
              paddingVertical: 10,
              borderRadius: 10,
              elevation: 2,
            }}>
            <Text>Select Country</Text>
          </Layout>
        }
        flatListProps={{
          data: this.props.data,
          renderItem: ({ item, index }) => (
            <Ripple
              onPress={() => {
                this.props.selectCountry(item);
                this.close();
              }}
              key={index}
              style={{
                padding: 10,
                flexDirection: "row",
                alignItems: "center",
              }}>
              <Image
                source={item.image}
                style={{ width: 30, height: 30, marginRight: 10 }}
                resizeMode="contain"
              />
              <Text>
                {item.label} ({item.dialCode})
              </Text>
            </Ripple>
          ),
        }}
        ref={(ref) => (this.modal = ref)}></Modalize>
    );
  }
}
class PhoneInputCustom extends React.PureComponent {
  constructor() {
    super();

    this.onPressFlag = this.onPressFlag.bind(this);
    this.selectCountry = this.selectCountry.bind(this);
    this.state = {
      pickerData: [],
    };
  }

  componentDidMount() {
    // this.setState({
    //   pickerData: this.phone.getPickerData(),
    // });
    this.props.setPickerData(this.phone.getPickerData());
  }

  onPressFlag() {
    this.props.myCountryPicker.open();
  }

  selectCountry(country) {
    this.phone.selectCountry(country.iso2);
  }
  isValidNumber() {
    return this.phone.isValidNumber();
  }
  getCountryCode() {
    return this.phone.getCountryCode();
  }
  getValue() {
    return this.phone.getValue();
  }

  render() {
    return (
      <View>
        <PhoneInput
          initialCountry="in"
          autoFormat={true}
          style={{ marginVertical: 15 }}
          flagStyle={{
            zIndex: 1,
            marginLeft: 10,
            padding: 5,
            marginBottom: 20,
          }}
          textStyle={{ marginLeft: -50 }}
          textComponent={(props) => (
            <Input
              {...props}
              accessoryLeft={(props) => <View style={{ width: 30 }} />}
              placeholder="Mobile"
              keyboardType="phone-pad"
              caption={this.props?.caption}
              captionIcon={this.props?.captionIcon}
              status={this.props?.status}
              onChangeText={(value) => {
                props?.onChangeText(value);
                this.props.onChangeText(value);
              }}
              blurOnSubmit={false}
            />
          )}
          ref={(ref) => {
            this.phone = ref;
          }}
          onPressFlag={this.onPressFlag}
        />
      </View>
    );
  }
}

const SignupScreen = ({ navigation, setLoggedIn, locked, setLocked }) => {
  const [secureTextEntry, setSecureTextEntry] = React.useState(true);
  const [secureTextEntry2, setSecureTextEntry2] = React.useState(true);
  const [loading, setLoading] = React.useState(false);
  const [loadingUsername, setLoadingUsername] = React.useState(false);
  const [username, setUsername] = React.useState(false);
  const [country, setCountry] = React.useState([]);
  const [flow, setFlow] = React.useState(0);
  const [MainError, setMainError] = React.useState("");
  const bottomAnim = new Animated.Value(0);
  const modal = React.useRef();
  const modalPhone = React.useRef();
  console.log("render");
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
    mobile: "",
    email: "",
    confirm: "",
  });
  const [errors, setErrors] = React.useState({
    username: "",
    password: "",
    mobile: "",
    email: "",
    confirm: "",
  });
  var usernameInput = React.useRef();
  var mobileInput = React.useRef();
  var emailInput = React.useRef();
  var passwordInput = React.useRef();
  var confirmInput = React.useRef();
  var signflow = React.useRef();
  const toggleSecureEntry = () => {
    setSecureTextEntry(!secureTextEntry);
  };
  const toggleSecureEntry2 = () => {
    setSecureTextEntry2(!secureTextEntry2);
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
  const checkUsername = (user_name = values.username) => {
    if (!user_name) {
      setErrors({ ...errors, username: "Username is Required!" });
    } else {
      setMainError("");
      setErrors({ username: "" });
      setLoadingUsername(true);
      setTimeout(() => {
        fetch(Constants.API_URL + "/accounts/register/username/", {
          method: "POST",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ username: user_name }),
        })
          .then((response) => {
            const statusCode = response.status;
            const data = response.json();
            return Promise.all([statusCode, data]);
          })
          .then(([statusCode, data]) => {
            if (statusCode === 200) {
              setUsername(true);
            } else if (statusCode === 400) {
              setUsername(false);
              setErrors({ ...errors, username: "Invalid Username!" });
            } else {
              setUsername(false);
              setErrors({ ...errors, username: data.detail });
            }
            setLoadingUsername(false);
          })
          .catch((error) => {
            setErrors({ ...errors, username: error });
            setUsername(false);
            setLoadingUsername(false);
          });
      }, 0);
    }
  };
  const renderIcon = (props) => (
    <TouchableWithoutFeedback onPress={toggleSecureEntry}>
      <Icon {...props} name={secureTextEntry ? "eye-off" : "eye"} />
    </TouchableWithoutFeedback>
  );
  const renderIcon2 = (props) => (
    <TouchableWithoutFeedback onPress={toggleSecureEntry2}>
      <Icon {...props} name={secureTextEntry2 ? "eye-off" : "eye"} />
    </TouchableWithoutFeedback>
  );

  const ValidatedIndicator = (props) => (
    <Icon {...props} name="checkmark-circle-outline" />
  );

  const LoadingIndicator = (props) => (
    <View style={[props.style, styles.indicator]}>
      <Spinner size="small" />
    </View>
  );
  const AlertIcon = (props) => <Icon {...props} name="alert-circle-outline" />;
  const handleBack = () => {
    if (flow === 0) return false;
    else if (flow === 1) {
      signflow.current.scrollTo({
        x: 0,
        animated: true,
      });
      setFlow(0);
    } else if (flow === 2) {
      signflow.current.scrollTo({
        x: Dimensions.get("screen").width,
        animated: true,
      });
      setFlow(1);
    }
    return true;
  };
  const backHandler = BackHandler.addEventListener(
    "hardwareBackPress",
    handleBack
  );
  return (
    <Layout style={{ flex: 1 }}>
      {/* <TopNavigation title="Login Page" alignment="center" />
      <Divider /> */}

      <Image
        source={require("../../../assets/logo.png")}
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
          source={require("../../../assets/brandName.png")}
          style={{ height: 120, width: 200 }}
          resizeMode="contain"
        />
      </Layout>

      <Layout style={styles.Layout}>
        {flow > 0 && (
          <Layout
            style={{
              alignItems: "flex-start",
              justifyContent: "center",
              width: "100%",
              marginTop: -50,
              marginBottom: 80,
              marginLeft: 30,
              backgroundColor: "transparent",
            }}>
            <Ripple onPress={handleBack}>
              <Icon
                style={{ width: 30, height: 30, tintColor: "#000" }}
                name="corner-up-left-outline"
              />
            </Ripple>
          </Layout>
        )}
        <Text
          category="h1"
          style={{
            textAlign: "left",
            marginBottom: 50,
            marginTop: -50,
            paddingLeft: 30,
            width: "100%",
          }}>
          Create New Account
        </Text>
        {/* <Text
          category="h6"
          style={{
            textAlign: "left",
            marginBottom: 50,
            marginTop: -40,
            paddingLeft: 30,
            width: "100%",
            paddingRight: 20,
          }}>
          You are going to feel a new experience with us❤
        </Text> */}
        <Text
          appearance="hint"
          style={{
            textAlign: "left",
            marginBottom: 20,
            marginTop: -40,
            paddingLeft: 30,
            paddingRight: 20,
            width: "100%",
          }}>
          We need a few details to continue
        </Text>
        <Layout style={{ width: "100%", maxWidth: 500 }}>
          <ScrollView
            ref={signflow}
            scrollEnabled={false}
            horizontal
            showsHorizontalScrollIndicator={false}>
            <Layout
              style={{ width: Dimensions.get("screen").width, padding: 10 }}>
              <Input
                caption={errors.username}
                captionIcon={errors.username ? AlertIcon : false}
                accessoryRight={
                  loadingUsername
                    ? LoadingIndicator
                    : username
                    ? ValidatedIndicator
                    : errors.username
                    ? AlertIcon
                    : false
                }
                disabled={loading}
                placeholder="Username"
                status={
                  errors.username ? "danger" : username ? "success" : "basic"
                }
                value={values.username}
                onChangeText={(nextValue) => {
                  setErrors({ ...errors, username: "" });
                  setValues({ ...values, username: nextValue.trim() });
                  if (nextValue.length > 5) checkUsername(nextValue);
                }}
                ref={usernameInput}
                returnKeyType={"next"}
                style={{ marginBottom: 5 }}
                onSubmitEditing={() => {
                  if (username) {
                    signflow.current.scrollTo({
                      x: Dimensions.get("screen").width,
                      animated: true,
                    });
                    setFlow(1);
                  }
                }}
              />
              <Button
                style={styles.Button}
                onPress={() => {
                  if (username) {
                    signflow.current.scrollTo({
                      x: Dimensions.get("screen").width,
                      animated: true,
                    });
                    setFlow(1);
                  }
                }}
                disabled={!username}>
                {"Next"}
              </Button>
            </Layout>
            <Layout
              style={{ width: Dimensions.get("screen").width, padding: 10 }}>
              <Input
                caption={errors.password}
                captionIcon={errors.password ? AlertIcon : false}
                status={errors.password ? "danger" : "basic"}
                disabled={loading}
                ref={(input) => {
                  passwordInput = input;
                }}
                placeholder="New Password"
                value={values.password}
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
                      password:
                        "Password Must Follow have atleast:\n one lowercase letter, one uppercase letter,\n one numeric digit, and one special character\n and length between 8-15",
                    });
                  } else setErrors({ ...errors, password: "" });
                  setValues({ ...values, password: nextValue.trim() });
                }}
                returnKeyType="next"
                accessoryRight={renderIcon}
                onSubmitEditing={() => {
                  confirmInput?.focus();
                  confirmInput?.current?.focus();
                }}
                blurOnSubmit={false}
                style={{ marginBottom: 5, fontFamily: "sans-serif" }}
                secureTextEntry={secureTextEntry}
              />
              <Input
                caption={errors.confirm}
                captionIcon={errors.confirm ? AlertIcon : false}
                status={errors.confirm ? "danger" : "basic"}
                disabled={loading}
                ref={(input) => {
                  confirmInput = input;
                }}
                placeholder="Confirm Password"
                value={values.confirm}
                onChangeText={(nextValue) => {
                  setErrors({
                    ...errors,
                    confirm:
                      nextValue !== values.password
                        ? "Password's do not match!"
                        : "",
                  });
                  setValues({ ...values, confirm: nextValue.trim() });
                }}
                accessoryRight={renderIcon2}
                returnKeyType="next"
                onSubmitEditing={() => {
                  if (
                    values.password.match(
                      /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[^a-zA-Z0-9])(?!.*\s).{8,15}$/
                    ) &&
                    values.confirm === values.password
                  ) {
                    signflow.current.scrollTo({
                      x: Dimensions.get("screen").width * 2,
                      animated: true,
                    });
                    setFlow(2);
                  }
                }}
                style={{ marginBottom: 5, fontFamily: "sans-serif" }}
                secureTextEntry={secureTextEntry2}
              />
              <Button
                style={styles.Button}
                onPress={() => {
                  if (
                    values.password.match(
                      /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[^a-zA-Z0-9])(?!.*\s).{8,15}$/
                    ) &&
                    values.confirm === values.password
                  ) {
                    signflow.current.scrollTo({
                      x: Dimensions.get("screen").width * 2,
                      animated: true,
                    });
                    setFlow(2);
                  }
                }}
                disabled={
                  !values.password.match(
                    /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[^a-zA-Z0-9])(?!.*\s).{8,15}$/
                  ) || values.confirm !== values.password
                }>
                {"Next"}
              </Button>
            </Layout>
            <Layout
              style={{ width: Dimensions.get("screen").width, padding: 10 }}>
              <Text appearance="hint" style={{ marginBottom: 5 }}>
                Enter Mobile or Email address
              </Text>

              <PhoneInputCustom
                ref={mobileInput}
                myCountryPicker={modalPhone.current}
                setPickerData={(country_) => {
                  setCountry([...country_]);
                }}
                caption={errors.mobile}
                captionIcon={errors.mobile ? AlertIcon : false}
                status={errors.mobile ? "danger" : "basic"}
                onChangeText={(nextValue) => {
                  // setErrors({ ...errors, mobile: "" });
                  // setValues({ ...values, mobile: nextValue.trim() });
                }}
              />

              <Input
                caption={errors.email}
                captionIcon={errors.email ? AlertIcon : false}
                disabled={loading}
                placeholder="Email"
                status={errors.email ? "danger" : "basic"}
                value={values.email}
                onChangeText={(nextValue) => {
                  setErrors({ ...errors, email: "" });
                  setValues({ ...values, email: nextValue.trim() });
                }}
                ref={emailInput}
                returnKeyType={"next"}
                style={{
                  marginBottom: 5,
                }}
                keyboardType="email-address"
                blurOnSubmit={false}
                onSubmitEditing={() => {
                  // passwordInput.focus();
                }}
              />
              <Button
                style={styles.Button}
                onPress={() => {
                  setErrors({ ...errors, mobile: "Invalid mobile" });
                }}>
                {"Next"}
              </Button>
            </Layout>

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
            <Button
              style={styles.Button}
              onPress={
                loading
                  ? () => {
                      setLoading(false);
                    }
                  : onPress
              }
              appearance={loading ? "outline" : "filled"}
              accessoryLeft={loading ? LoadingIndicator : null}>
              {loading ? "Creating a new account..." : "Create a New Account"}
            </Button>
          </ScrollView>
          <Divider style={{ marginTop: 20 }} />
          {/* 
          <Layout style={{ alignItems: "center", justifyContent: "center" }}>
            <Button
              style={{ ...styles.Button }}
              disabled={loading}
              onPress={() => {
                navigation.replace("Login");
              }}
              appearance="ghost">
              Already have account with us?
            </Button>
          </Layout> */}
        </Layout>
      </Layout>
      <Divider />
      <Ripple
        onPress={() => {
          modal.current?.open();
        }}
        style={{ alignItems: "center", justifyContent: "center" }}>
        <Button
          style={{ ...styles.Button, padding: 10 }}
          disabled={loading}
          appearance="ghost">
          <Text appearance="hint" style={{ textAlign: "center" }}>
            By Signing up you agree with our data policy & terms of use{" "}
          </Text>
          Click here to view now!
        </Button>
      </Ripple>
      <CountryModal
        ref={modalPhone}
        data={country}
        selectCountry={(item) => mobileInput.current.selectCountry(item)}
      />
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
  SignupScreen
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
