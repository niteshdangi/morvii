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
import { setLoggedIn } from "../../actions/loginAction";
import { StyleSheet, View, BackHandler } from "react-native";
import { TouchableWithoutFeedback } from "@ui-kitten/components/devsupport";

const Signup4Screen = ({ navigation, route, setLoggedIn }) => {
  const [secureTextEntry, setSecureTextEntry] = React.useState(true);
  const [secureTextEntry2, setSecureTextEntry2] = React.useState(true);
  const [loading, setLoading] = React.useState(false);
  const [validated, setValidated] = React.useState(false);
  const [values, setValues] = React.useState("");
  const [errors, setErrors] = React.useState("");
  const [validated2, setValidated2] = React.useState(false);
  const [values2, setValues2] = React.useState("");
  const [errors2, setErrors2] = React.useState("");
  var pass2 = React.useRef();
  React.useEffect(() => {
    try {
      if (!route.params.username) {
        navigation.replace("Signup");
      }
      if (!route.params.values) {
        navigation.replace("Signup2", { username: route.params.username });
      }
    } catch (e) {
      navigation.replace("Signup");
    }
  }, [route]);
  const toggleSecureEntry = () => {
    setSecureTextEntry(!secureTextEntry);
  };
  const toggleSecureEntry2 = () => {
    setSecureTextEntry2(!secureTextEntry);
  };
  const onPress = () => {
    console.log(errors);

    if (!values) {
      setErrors("OTP is Required!");
    } else {
      setErrors("");
      setValidated(false);
      setLoading(true);
      setTimeout(() => {
        fetch(Constants.API_URL + "/accounts/register/complete/", {
          method: "POST",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            token: route.params.rtoken,
            username: route.params.username,
            password: [values, values2],
            [route.params.mobile ? "mobile" : "email"]: route.params.values,
            isMobile: route.params.mobile,
          }),
        })
          .then((response) => {
            const statusCode = response.status;
            const data = response.json();
            return Promise.all([statusCode, data]);
          })
          .then(([statusCode, data]) => {
            if (statusCode === 200) {
              if (data.token) {
                setValidated(true);
                setLoggedIn({
                  state: true,
                  token: data.token,
                  user: data.user,
                });
                navigation.reset({ index: 0, routes: [{ name: "BaseApp" }] });
              } else {
                setErrors(
                  "Failed to Verify OTP! Please Try again after Sometime!"
                );
              }
            } else {
              setErrors(data.detail);
            }
            setLoading(false);
          })
          .catch((error) => {
            console.log(error);
          });
      }, 0);
    }
  };
  const onChangeText = (nextValue) => {
    if (
      !nextValue
        .trim()
        .match(
          /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[^a-zA-Z0-9])(?!.*\s).{8,15}$/
        )
    ) {
      setErrors(
        "Password Must Follow have atleast:\n one lowercase letter, one uppercase letter,\n one numeric digit, and one special character\n and length between 8-15"
      );
      setValidated(false);
    } else {
      setErrors("");
      setValidated(true);
    }
    setValues(nextValue.trim());
  };
  const onChangeText2 = (nextValue) => {
    if (nextValue.trim() !== values) {
      setErrors2("Passwords must be same!");
      setValidated2(false);
    } else {
      setErrors2("");
      setValidated2(true);
    }
    setValues2(nextValue.trim());
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

  const AlertIcon = (props) => <Icon {...props} name="alert-circle-outline" />;
  const lockIcon = (props) => <Icon {...props} name="lock-outline" />;
  const unlockIcon = (props) => <Icon {...props} name="unlock-outline" />;
  return (
    <SafeAreaView style={{ flex: 1 }}>
      <TopNavigation title="Enter Password" alignment="center" />
      <Divider />
      <Layout style={styles.Layout}>
        <Layout style={{ width: "90%", maxWidth: 500, marginTop: 50 }}>
          <Layout style={{ alignItems: "center", justifyContent: "center" }}>
            <Input
              caption={errors}
              captionIcon={errors ? AlertIcon : false}
              disabled={loading}
              placeholder={"Password"}
              status={errors ? "danger" : validated ? "success" : "basic"}
              value={values}
              accessoryLeft={lockIcon}
              onChangeText={(nextValue) => {
                onChangeText(nextValue);
              }}
              returnKeyType={"next"}
              style={{ marginBottom: 5 }}
              blurOnSubmit={false}
              onSubmitEditing={() => pass2.focus()}
              accessoryRight={renderIcon}
              secureTextEntry={secureTextEntry}
            />
            <Input
              ref={(input) => (pass2 = input)}
              caption={errors2}
              captionIcon={errors2 ? AlertIcon : false}
              disabled={loading}
              placeholder={"Confirm Password"}
              status={errors2 ? "danger" : validated2 ? "success" : "basic"}
              value={values2}
              accessoryLeft={lockIcon}
              onChangeText={(nextValue) => {
                onChangeText2(nextValue);
              }}
              style={{ marginBottom: 5 }}
              onSubmitEditing={onPress}
              accessoryRight={renderIcon2}
              secureTextEntry={secureTextEntry2}
            />
            <Button
              style={styles.Button}
              disabled={!validated}
              onPress={onPress}>
              {"SignUp"}
            </Button>
          </Layout>
        </Layout>
      </Layout>
      <Divider />
      <Layout style={{ alignItems: "center", justifyContent: "center" }}>
        <Button
          style={{ ...styles.Button, padding: 10 }}
          disabled={loading}
          accessoryLeft={unlockIcon}
          appearance="ghost">
          Yay! You are just a button click away!
        </Button>
      </Layout>
    </SafeAreaView>
  );
};
const mapStateToProps = (state) => ({
  auth: state.secure.auth,
});

export default connect(mapStateToProps, { setLoggedIn })(Signup4Screen);
const styles = StyleSheet.create({
  Layout: { flex: 1, alignItems: "center" },
  Button: { width: "100%" },
});
