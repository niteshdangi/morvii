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

const Signup3Screen = ({ navigation, route, setLoggedIn }) => {
  const [secureTextEntry, setSecureTextEntry] = React.useState(true);
  const [loading, setLoading] = React.useState(false);
  const [validated, setValidated] = React.useState(false);
  const [values, setValues] = React.useState("");
  const [errors, setErrors] = React.useState("");

  React.useEffect(() => {
    console.log(route.params);
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
  const onPress = () => {
    console.log(errors);

    if (!values) {
      setErrors("OTP is Required!");
    } else {
      setErrors("");
      setValidated(false);
      setLoading(true);
      setTimeout(() => {
        fetch(Constants.API_URL + "/accounts/register/verify/", {
          method: "POST",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            token: route.params.otoken,
            otp: values,
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
                navigation.navigate("Signup4", {
                  username: route.params.username,
                  mobile: route.params.mobile,
                  values: route.params.values,
                  rtoken: data.token,
                  validated: true,
                });
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
    if (!nextValue.trim().match("^[0-9]+$")) {
      setErrors("OTP can only have digits");
      setValidated(false);
    } else if (nextValue.trim().length !== 6) {
      setErrors("Enter 6 digit OTP!");
      setValidated(false);
    } else {
      setErrors("");
      setValidated(true);
    }
    setValues(nextValue.trim());
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
  const ValidatedIndicator = (props) => (
    <Icon {...props} name="checkmark-circle-outline" />
  );

  const AlertIcon = (props) => <Icon {...props} name="alert-circle-outline" />;
  const lockIcon = (props) => <Icon {...props} name="lock-outline" />;
  const unlockIcon = (props) => <Icon {...props} name="unlock-outline" />;
  return (
    <SafeAreaView style={{ flex: 1 }}>
      <TopNavigation
        title={
          route.params.mobile
            ? "Mobile No. Verification"
            : "Email ID Verification"
        }
        alignment="center"
      />
      <Divider />
      <Layout style={styles.Layout}>
        <Layout style={{ width: "90%", maxWidth: 500, marginTop: 50 }}>
          <Layout style={{ justifyContent: "center" }}>
            <Input
              caption={errors}
              captionIcon={errors ? AlertIcon : false}
              disabled={loading}
              accessoryRight={loading ? LoadingIndicator : renderIcon}
              placeholder={"OTP ******"}
              maxLength={6}
              keyboardType="numeric"
              status={errors ? "danger" : validated ? "success" : "basic"}
              value={values}
              accessoryLeft={lockIcon}
              onChangeText={(nextValue) => {
                onChangeText(nextValue);
              }}
              style={{ marginBottom: 5 }}
              onSubmitEditing={onPress}
              secureTextEntry={secureTextEntry}
            />
            <Text style={{ padding: 10 }}>
              {"OTP was sent to: " + route.params.values}
            </Text>
            <Button
              style={styles.Button}
              disabled={!validated}
              onPress={onPress}>
              {"Verify"}
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
          onPress={() => {
            navigation.navigate("Signup4", {
              username: route.params.username,
              mobile: route.params.mobile,
              values: route.params.values,
              validated: false,
            });
          }}
          appearance="ghost">
          Verify Later
        </Button>
      </Layout>
    </SafeAreaView>
  );
};
const mapStateToProps = (state) => ({
  auth: state.secure.auth,
});

export default connect(mapStateToProps, { setLoggedIn })(Signup3Screen);
const styles = StyleSheet.create({
  Layout: { flex: 1, alignItems: "center" },
  Button: { width: "100%" },
});
