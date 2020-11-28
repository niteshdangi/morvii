import React, { Component } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { Layout, Icon, Text, Spinner } from "@ui-kitten/components";
import Ripple from "react-native-material-ripple";
import { TouchableOpacity } from "react-native-gesture-handler";
import { Dimensions, ScrollView, StatusBar } from "react-native";
import UserObj from "./profile/UserObj";
import * as Constants from "./Constants";
import { connect } from "react-redux";
import { RecommendationObj } from "./home/recommendations";
class MopicLiked extends Component {
  state = { loading: true, mopics: [] };
  componentDidMount() {
    fetch(Constants.API_URL + "/mopic/liked/", {
      method: "POST",
      headers: {
        Accept: "application/json",
        Authorization: "Token " + this.props.auth.token,
        "Content-Type": "application/json",
      },
    })
      .then((response) => {
        const statusCode = response.status;
        const data = response.json();
        return Promise.all([statusCode, data]);
      })
      .then(([statusCode, data]) => {
        this.setState({
          mopics: data.mopics,
          loading: false,
        });
      })
      .catch(() => {
        this.setState({ loading: false });
      });
  }
  render() {
    const smaller = Math.random() > 0.5;

    const data = this.state.mopics;
    const data1 = data.slice(2, (data.length + 2) / 2);
    const data2 = data.slice(
      (data.length + 2) / 2,
      data.length % 2 === 0 ? data.length : data.length - 1
    );
    return (
      <SafeAreaView>
        <Layout
          style={{
            width: "100%",
            height: 50,
            justifyContent: "space-between",
            alignItems: "center",
            flexDirection: "row",
            paddingRight: 10,
            paddingLeft: 10,
            elevation: 1,
          }}>
          <Layout
            style={{
              flexDirection: "row",
              justifyContent: "center",
              alignItems: "center",
            }}>
            <Ripple
              style={{ padding: 10 }}
              onPress={() => this.props.navigation.goBack()}>
              <Icon
                name="arrow-back-outline"
                style={{
                  width: 27,
                  height: 27,
                  tintColor: "black",
                }}
              />
            </Ripple>
            <Text style={{ fontSize: 18, padding: 10 }}>
              Mopics you Recently Liked
            </Text>
          </Layout>
        </Layout>
        {this.state.loading ? (
          <Layout
            style={{
              justifyContent: "center",
              alignItems: "center",
              height: "100%",
            }}>
            <Spinner />
          </Layout>
        ) : (
          <ScrollView>
            {data.length > 1 ? (
              <Layout
                style={{
                  flexDirection: "row",
                  backgroundColor: "transparent",
                }}>
                <RecommendationObj
                  item={data[0]}
                  navigation={this.props.navigation}
                  smaller={smaller && data.length > 3}
                  token={this.props.token}
                />
                <RecommendationObj
                  item={data[1]}
                  navigation={this.props.navigation}
                  smaller={!smaller && data.length > 3}
                  token={this.props.token}
                />
              </Layout>
            ) : data.length == 1 ? (
              <Layout
                style={{ justifyContent: "center", alignItems: "center" }}>
                <RecommendationObj
                  item={data[0]}
                  navigation={this.props.navigation}
                  token={this.props.token}
                  width={Dimensions.get("screen").width - 50}
                />
              </Layout>
            ) : null}
            <Layout
              style={{
                flexDirection: "row",
                backgroundColor: "transparent",
              }}>
              <Layout style={smaller ? { marginTop: -50 } : {}}>
                {data1.map((item, index) => {
                  return (
                    <RecommendationObj
                      item={item}
                      key={index}
                      navigation={this.props.navigation}
                      smallerShift={smaller ? index % 2 === 0 : index % 2 !== 0}
                      smaller={!smaller && index === data2.length - 1}
                      token={this.props.token}
                    />
                  );
                })}
              </Layout>
              <Layout style={!smaller ? { marginTop: -50 } : {}}>
                {data2.map((item, index) => {
                  return (
                    <RecommendationObj
                      item={item}
                      key={index}
                      navigation={this.props.navigation}
                      smallerShift={smaller ? index % 2 === 0 : index % 2 !== 0}
                      smaller={smaller && index === data2.length - 1}
                      token={this.props.token}
                    />
                  );
                })}
              </Layout>
            </Layout>
            {data.length % 2 !== 0 && data.length > 1 && (
              <Layout
                style={{
                  justifyContent: "center",
                  alignItems: "center",
                  backgroundColor: "transparent",
                }}>
                <RecommendationObj
                  item={data[data.length - 1]}
                  navigation={this.props.navigation}
                  token={this.props.token}
                  width={Dimensions.get("screen").width - 50}
                />
              </Layout>
            )}
            <Layout style={{ height: 70, backgroundColor: "transparent" }} />
          </ScrollView>
        )}
      </SafeAreaView>
    );
  }
}
const mapStateToProps = (state) => ({
  auth: state.secure.auth,
});
export default connect(mapStateToProps, null)(MopicLiked);
