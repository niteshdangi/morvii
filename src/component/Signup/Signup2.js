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

const Signup2Screen = ({ navigation, route, setLoggedIn }) => {
  const [loading, setLoading] = React.useState(false);
  const [validated, setValidated] = React.useState(false);
  const [mobile, setMobile] = React.useState(true);
  const [values, setValues] = React.useState("");
  const [errors, setErrors] = React.useState("");

  React.useEffect(() => {
    try {
      if (!route.params.username) {
        navigation.replace("Signup");
      }
    } catch (e) {
      navigation.replace("Signup");
    }
  }, [route]);
  const onPress = () => {
    console.log(errors);

    if (!values) {
      mobile
        ? setErrors("Mobile is Required!")
        : setErrors("Email is Required!");
    } else {
      setErrors("");
      setLoading(true);
      setValidated(false);

      setTimeout(() => {
        fetch(
          mobile
            ? Constants.API_URL + "/accounts/register/mobile/"
            : Constants.API_URL + "/accounts/register/mail/",
          {
            method: "POST",
            headers: {
              Accept: "application/json",
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              username: route.params.username,
              [mobile ? "mobile" : "mail"]: values,
            }),
          }
        )
          .then((response) => {
            const statusCode = response.status;
            const data = response.json();
            return Promise.all([statusCode, data]);
          })
          .then(([statusCode, data]) => {
            if (statusCode === 200) {
              if (data.token) {
                setValidated(true);
                navigation.navigate("Signup3", {
                  username: route.params.username,
                  mobile,
                  values,
                  otoken: data.token,
                });
              } else {
                setErrors(
                  mobile
                    ? "Failed to Validate Mobile! Please Try again after Sometime!"
                    : "Failed to Validate Email! Please Try again after Sometime!"
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
    if (mobile) {
      if (!nextValue.trim().match("^[0-9]+$")) {
        setErrors("Mobile can only have digits");
        setValidated(false);
      } else {
        setErrors("");
        setValidated(true);
      }
    } else {
      if (
        !nextValue
          .trim()
          .match(
            /(?:[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?|\[(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?|[a-z0-9-]*[a-z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)\])/
          )
      ) {
        setErrors("Invalid Email!");
        setValidated(false);
      } else {
        setErrors("");
        setValidated(true);
      }
    }
    setValues(nextValue.trim());
  };
  const LoadingIndicator = (props) => (
    <View style={[props.style, styles.indicator]}>
      <Spinner size="small" />
    </View>
  );
  const ValidatedIndicator = (props) => (
    <Icon {...props} name="checkmark-circle-outline" />
  );

  const AlertIcon = (props) => <Icon {...props} name="alert-circle-outline" />;
  const MobileIcon = (props) => <Icon {...props} name="email-outline" />;
  const EmailIcon = (props) => <Icon {...props} name="smartphone-outline" />;
  return (
    <SafeAreaView style={{ flex: 1 }}>
      <TopNavigation
        title={mobile ? "Signup - Mobile" : "Signup - Email"}
        alignment="center"
      />
      <Divider />
      <Layout style={styles.Layout}>
        <Layout style={{ width: "90%", maxWidth: 500, marginTop: 50 }}>
          <Layout style={{ alignItems: "center", justifyContent: "center" }}>
            <Input
              caption={errors}
              captionIcon={errors ? AlertIcon : false}
              disabled={loading}
              accessoryRight={
                loading
                  ? LoadingIndicator
                  : validated
                  ? ValidatedIndicator
                  : errors
                  ? AlertIcon
                  : false
              }
              placeholder={mobile ? "Mobile" : "Email ID"}
              keyboardType={mobile ? "phone-pad" : "email-address"}
              status={errors ? "danger" : validated ? "success" : "basic"}
              value={values}
              accessoryLeft={mobile ? EmailIcon : MobileIcon}
              onChangeText={(nextValue) => {
                onChangeText(nextValue);
              }}
              style={{ marginBottom: 5 }}
              onSubmitEditing={onPress}
            />
            <Button
              style={styles.Button}
              disabled={!validated}
              onPress={onPress}>
              {"Next"}
            </Button>
          </Layout>
        </Layout>
      </Layout>
      <Divider />
      <Layout style={{ alignItems: "center", justifyContent: "center" }}>
        <Button
          style={{ ...styles.Button, padding: 10 }}
          disabled={loading}
          accessoryLeft={!mobile ? EmailIcon : MobileIcon}
          onPress={() => {
            setMobile(!mobile);
          }}
          appearance="ghost">
          Use {mobile ? "Email ID" : "Mobile"} instead!
        </Button>
      </Layout>
    </SafeAreaView>
  );
};
const mapStateToProps = (state) => ({
  auth: state.secure.auth,
});

export default connect(mapStateToProps, { setLoggedIn })(Signup2Screen);
const styles = StyleSheet.create({
  Layout: { flex: 1, alignItems: "center" },
  Button: { width: "100%" },
});
