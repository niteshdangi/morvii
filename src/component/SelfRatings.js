import React, { Component } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { Layout, Icon, Text, Spinner } from "@ui-kitten/components";
import Ripple from "react-native-material-ripple";
import { TouchableOpacity } from "react-native-gesture-handler";
import { Dimensions, ScrollView } from "react-native";
import UserObj from "./profile/UserObj";
import * as Constants from "./Constants";
import { connect } from "react-redux";
import { RecommendationObj } from "./home/recommendations";
import { Rating } from "react-native-ratings";
class SelfRatings extends Component {
  state = { loading: true, ratings: [0, 0, 0, 0, 0] };
  componentDidMount() {
    fetch(Constants.API_URL + "/mopic/ratings-self/", {
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
          ratings: data.ratings,
          loading: false,
        });
      })
      .catch(() => {
        this.setState({ loading: false });
      });
  }
  render() {
    return (
      <SafeAreaView style={{ backgroundColor: "#fff", flex: 1 }}>
        <Layout
          style={{
            width: "100%",
            height: 50,
            justifyContent: "space-between",
            alignItems: "center",
            flexDirection: "row",
            paddingRight: 10,
            paddingLeft: 10,
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
              Ratings Summary by You
            </Text>
          </Layout>
        </Layout>
        <ScrollView style={{ flex: 1, flexGrow: 1 }}>
          <Layout
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              backgroundColor: "#fff",
              padding: 10,
              elevation: 0.1,
              height: 50,
            }}>
            <Rating
              type="custom"
              ratingColor="orange"
              showRating={false}
              imageSize={25}
              startingValue={5}
              readonly={true}
            />
            {this.state.loading ? (
              <Spinner />
            ) : (
              <Text>{this.state.ratings[4]} Ratings</Text>
            )}
          </Layout>
          <Layout
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              backgroundColor: "#fff",
              padding: 10,
              elevation: 0.1,
              height: 50,
            }}>
            <Rating
              type="custom"
              ratingColor="orange"
              showRating={false}
              imageSize={25}
              startingValue={4}
              readonly={true}
            />
            {this.state.loading ? (
              <Spinner />
            ) : (
              <Text>{this.state.ratings[3]} Ratings</Text>
            )}
          </Layout>
          <Layout
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              backgroundColor: "#fff",
              padding: 10,
              elevation: 0.1,
              height: 50,
            }}>
            <Rating
              type="custom"
              ratingColor="orange"
              showRating={false}
              imageSize={25}
              startingValue={3}
              readonly={true}
            />
            {this.state.loading ? (
              <Spinner />
            ) : (
              <Text>{this.state.ratings[2]} Ratings</Text>
            )}
          </Layout>
          <Layout
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              backgroundColor: "#fff",
              padding: 10,
              elevation: 0.1,
              height: 50,
            }}>
            <Rating
              type="custom"
              ratingColor="orange"
              showRating={false}
              imageSize={25}
              startingValue={2}
              readonly={true}
            />
            {this.state.loading ? (
              <Spinner />
            ) : (
              <Text>{this.state.ratings[1]} Ratings</Text>
            )}
          </Layout>
          <Layout
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              backgroundColor: "#fff",
              padding: 10,
              elevation: 0.1,
              height: 50,
            }}>
            <Rating
              type="custom"
              ratingColor="orange"
              showRating={false}
              imageSize={25}
              startingValue={1}
              readonly={true}
            />
            {this.state.loading ? (
              <Spinner />
            ) : (
              <Text>{this.state.ratings[0]} Ratings</Text>
            )}
          </Layout>

          <Layout style={{ height: 70, backgroundColor: "transparent" }} />
        </ScrollView>
      </SafeAreaView>
    );
  }
}
const mapStateToProps = (state) => ({
  auth: state.secure.auth,
});
export default connect(mapStateToProps, null)(SelfRatings);
