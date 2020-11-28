import React, { Component } from "react";
import { createMaterialTopTabNavigator } from "@react-navigation/material-top-tabs";
import HomeScreen from "../component/home";
import ChatScreen from "../component/chatScreen";
import { connect } from "react-redux";
import { BottomNavigation } from "@ui-kitten/components";
import { View, Easing, StatusBar, Dimensions } from "react-native";
import Animated from "react-native-reanimated";
import { BackHandler } from "react-native";
import { setShortModal } from "../actions/ShortModal";
import ExploreScreen from "../component/explore";
import ShortModal from "../component/ShortModal";

const { Navigator, Screen } = createMaterialTopTabNavigator();

class HomeNavigator extends Component {
  // state = {
  //   position: new Animated.Value(0),
  //   scale: new Animated.Value(1),
  //   borderRadius: new Animated.Value(0),
  // };
  constructor(props) {
    super(props);
    this.handleBackButtonClick = this.handleBackButtonClick.bind(this);
  }
  componentDidMount() {
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
    // this.props.navigation.goBack(null);
    // return true;
    if (this.props.ShortModal.action) {
      this.props.setShortModal(false, "Loading");
      return true;
    }
  }

  render() {
    // console.log("nav,", this.props.route.params);
    return (
      <Navigator
        initialRouteName="Home"
        style={{ backgroundColor: "rgba(0,0,0,0)" }}
        lazy={true}
        tabBarPosition="bottom"
        tabBar={(props) => <></>}>
        <Screen
          name="Message"
          component={ChatScreen}
          initialParams={{ socket: this.props.route.params.socket }}
        />
        <Screen
          name="Home"
          component={HomeScreen}
          initialParams={{ socket: this.props.route.params.socket }}
        />
        <Screen
          name="Explore"
          component={ExploreScreen}
          initialParams={{ story: this.props.route.params.story }}
        />
      </Navigator>
    );
  }
}

const mapStateToProps = (state) => ({
  ShortModal: state.main.ShortModal,
});
export default connect(mapStateToProps, { setShortModal })(HomeNavigator);
