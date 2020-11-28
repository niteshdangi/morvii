import * as React from "react";
import { connect } from "react-redux";
import { setLoggedIn } from "../actions/loginAction";
import { Image, Dimensions, StatusBar } from "react-native";

const SplashScreen = ({ navigation, auth }) => {
  React.useEffect(() => {
    setTimeout(function () {
      auth.isLoggedIn
        ? navigation.replace("BaseApp")
        : navigation.replace("Login");
    }, 0);
  }, [navigation, auth]);
  return (
    <Image
      source={require("../../assets/splash.png")}
      resizeMode="contain"
      style={{
        width: Dimensions.get("screen").width,
        height: Dimensions.get("screen").height,
        backgroundColor: "#fff",
      }}
    />
  );
};
const mapStateToProps = (state) => ({
  auth: state.secure.auth,
});
export default connect(mapStateToProps, { setLoggedIn })(SplashScreen);
