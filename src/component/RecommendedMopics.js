import { Layout } from "@ui-kitten/components";
import { LinearGradient } from "expo-linear-gradient";
import React, { PureComponent } from "react";
import { Dimensions, Image, StatusBar } from "react-native";
import { FlatList } from "react-native-gesture-handler";
import * as Constants from "./Constants";
import { Modalize } from "react-native-modalize";
import { connect } from "react-redux";
import { setShortModal } from "../actions/ShortModal";
import { MessageShareItem, TextInputShare } from "./home";
import Mopic from "./home/mopic";
import changeNavigationBarColor from "react-native-navigation-bar-color";

class RecommendedMopics extends PureComponent {
  constructor(props) {
    super(props);
    if (!this.props?.route?.params?.mopic) this.props.navigation.goBack();
    this.state = { mopics: [this.props?.route?.params?.mopic] };
    StatusBar.setBarStyle("light-content", true);
  }
  messageShare = React.createRef();

  componentDidMount() {
    this.props.navigation.addListener("blur", () => {
      changeNavigationBarColor("#ffffff", true);
    });

    this.props.navigation.addListener("focus", () => {
      changeNavigationBarColor("transparent", true);
    });
    StatusBar.setBarStyle("light-content", true);
    fetch(
      Constants.API_URL +
        "/mopic/recommendations/" +
        this.props?.route?.params?.mopic?.id +
        "/",
      {
        method: "POST",
        headers: {
          Accept: "application/json",
          Authorization: "Token " + this.props.auth.token,
          "Content-Type": "application/json",
        },
      }
    )
      .then((response) => {
        const statusCode = response.status;
        const data = response.json();
        return Promise.all([statusCode, data]);
      })
      .then(([statusCode, data]) => {
        this.setState({
          mopics: [...this.state.mopics, ...data.data],
          loading: false,
        });
      })
      .catch(() => {
        this.setState({ loading: false });
      });
  }
  render() {
    return (
      <Layout style={{ flex: 1 }}>
        <Modalize
          snapPoint={500}
          // adjustToContentHeight={true}
          rootStyle={{ elevation: 10 }}
          modalStyle={{ paddingHorizontal: 10 }}
          closeSnapPointStraightEnabled={false}
          HeaderComponent={
            <Layout
              style={{
                margin: 5,
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                paddingVertical: 10,
              }}>
              <Image
                source={{ uri: this.state.postSelected?.media[0]?.uri }}
                style={{ width: 50, height: 50 }}
              />
              <TextInputShare
                ref={this.messageShareInput}
                style={{
                  width: "80%",
                  marginHorizontal: 10,
                  height: 50,
                  borderBottomWidth: 1,
                  padding: 5,
                }}
                multiline
                placeholder="Enter a message..."
              />
            </Layout>
          }
          ref={this.messageShare}>
          {this.props.chatList?.map((item, index) => {
            return (
              <MessageShareItem
                message={this.messageShareInput}
                item={item}
                token={this.props.auth.token}
                post={this.state.postSelected}
              />
            );
          })}
        </Modalize>
        <FlatList
          data={[...this.state.mopics]}
          snapToInterval={
            Dimensions.get("window").height + StatusBar.currentHeight
          }
          style={{ flexGrow: 1 }}
          decelerationRate={1}
          renderItem={({ item, index }) => {
            return (
              <Layout
                key={index}
                style={{
                  height:
                    Dimensions.get("window").height + StatusBar.currentHeight,
                  justifyContent: "center",
                  alignItems: "center",
                }}>
                <Mopic
                  data={item}
                  navigation={this.props.navigation}
                  messageShare={() => {
                    this.setState({ postSelected: item });
                    this.messageShare.current?.open();
                  }}
                  onOptionPress={(
                    type,
                    props = {
                      component: "postOptions",
                    }
                  ) => {
                    this.props.setShortModal(true, type, props);
                  }}
                />
              </Layout>
            );
          }}
        />
        <LinearGradient
          colors={["#000", "transparent"]}
          style={{
            position: "absolute",
            height: 100,
            top: 0,
            left: 0,
            width: "100%",
          }}
        />
        <LinearGradient
          colors={["transparent", "#000"]}
          style={{
            position: "absolute",
            height: 150,
            bottom: 0,
            left: 0,
            width: "100%",
          }}
        />
      </Layout>
    );
  }
}
const mapStateToProps = (state) => ({
  auth: state.secure.auth,
  chatList: state.main.ChatReducer.list,
});
export default connect(mapStateToProps, { setShortModal })(RecommendedMopics);
