import React from "react";
import styled from "styled-components";
import {
  Animated,
  TouchableOpacity,
  Dimensions,
  Image,
  View,
} from "react-native";
import * as Icon from "@expo/vector-icons";
import { setShortModal } from "../../actions/ShortModal";
import { connect } from "react-redux";
import { Layout, Text, Divider } from "@ui-kitten/components";
import FlexImage from "react-native-flex-image";
import Mopic from "./mopic";
import { TouchableRipple } from "react-native-paper";
import Ripple from "react-native-material-ripple";
import { TouchableWithoutFeedback } from "react-native-gesture-handler";

const screenHeight = Dimensions.get("window").height * 1.2;

class ExploreQuickModal extends React.Component {
  state = {
    top: new Animated.Value(screenHeight),
    topFixed: new Animated.Value(115),
  };
  componentDidMount() {
    this.toggleModal();
    this.toggleFixed();
  }
  componentDidUpdate() {
    this.toggleModal();
    this.toggleFixed();
  }

  toggleModal = () => {
    if (this.props.ShortModal.action) {
      Animated.spring(this.state.top, {
        toValue: 0,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.spring(this.state.top, {
        toValue: screenHeight,
        useNativeDriver: true,
      }).start();
    }
  };

  toggleFixed = () => {
    if (this.props.ShortModal.props.fixed) {
      Animated.spring(this.state.topFixed, {
        toValue: 0,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.spring(this.state.topFixed, {
        toValue: 115,
        useNativeDriver: true,
      }).start();
    }
  };

  closeModal = () => {
    this.props.setShortModal(false, "Loading");
  };

  render() {
    return (
      <AnimatedContainer>
        <Layout
          style={{
            justifyContent: "center",
            alignItems: "center",
            height: Dimensions.get("window").height,
            backgroundColor: "transparent",
            padding: 10,
            paddingTop: 0,
          }}>
          <TouchableWithoutFeedback
            onPress={() => {
              this.props.ShortModal.props.navigation
                ? (this.closeModal(),
                  this.props.ShortModal.props.navigation.navigate("PostScreen"))
                : null;
            }}>
            <Mopic />
          </TouchableWithoutFeedback>
        </Layout>
        <View style={{ alignItems: "baseline" }}>
          <Bottom>
            <Animated.View style={{}}>
              <Layout
                style={{
                  elevation: 5,
                  borderTopLeftRadius: 20,
                  borderTopRightRadius: 20,
                  width: "100%",
                  padding: 10,
                  justifyContent: "space-evenly",
                }}>
                <Ripple
                  onPress={() => this.props.setShortModal(false, "Loading")}>
                  <Text style={{ textAlign: "center", padding: 5 }}>
                    {this.props.ShortModal.props.fixed
                      ? "Swipe To Close"
                      : "Swipe To Fix"}
                  </Text>
                </Ripple>
              </Layout>
            </Animated.View>
          </Bottom>
        </View>
      </AnimatedContainer>
    );
  }
}
const Bottom = styled.View`
  position: absolute;
  bottom: -80px;
  width: 100%;
  padding: 25px;
  padding-bottom: 0px;
`;
const Container = styled.View`
  position: absolute;
  width: 100%;
  height: 100%;
`;

const AnimatedContainer = Animated.createAnimatedComponent(Container);

const mapStateToProps = (state) => ({
  ShortModal: state.main.ShortModal,
});

export default connect(mapStateToProps, { setShortModal })(ExploreQuickModal);
