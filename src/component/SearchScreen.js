import React from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { Layout, Text, Icon, Input, Spinner } from "@ui-kitten/components";
import { TouchableRipple } from "react-native-paper";
import { TextInput } from "react-native-gesture-handler";
import { Dimensions } from "react-native";
import * as Constants from "./Constants";
import UserObj from "./profile/UserObj";
import { connect } from "react-redux";
class SearchScreen extends React.Component {
  state = { users: [], loading: false, searchText: "" };
  search(searchText) {
    if (searchText.length > 3) {
      this.setState({ searchText, loading: true });

      fetch(
        Constants.API_URL + "/accounts/search/" + searchText.toLowerCase(),
        {
          method: "GET",
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
          if (data?.users) {
            this.setState({
              users: data.users,
              loading: false,
            });
          } else {
            this.setState({ loading: false });
          }
        })
        .catch(() => {
          this.setState({ loading: false });
        });
    } else this.setState({ searchText });
  }
  render() {
    return (
      <SafeAreaView style={{ flex: 1 }}>
        {/* <View style={{ elevation: 10 }}> */}
        {/* </View> */}

        <Layout
          style={{
            flexWrap: "wrap",
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            padding: 10,
            elevation: 1,
            paddingLeft: 50,
          }}>
          <TouchableRipple
            onPress={() => {
              this.props.navigation.goBack();
            }}
            style={{ padding: 5, position: "absolute", elevation: 1, top: 10 }}>
            <Icon
              style={{ tintColor: "black", width: 30, height: 30 }}
              name="arrow-back-outline"
            />
          </TouchableRipple>
          <Layout style={{ flexDirection: "row" }}>
            {/* <StoryView size={35} borderColor="white" /> */}
            <Input
              placeholder="Search..."
              autoFocus={true}
              onChangeText={(value) => this.search(value)}
              style={{
                width: Dimensions.get("window").width - 60,
              }}
            />
          </Layout>
          <Layout
            style={{
              flexDirection: "row",
              position: "absolute",
              right: 10,
              top: 10,
              backgroundColor: "TRANSPARENT",
            }}>
            <TouchableRipple style={{ padding: 5 }}>
              {this.state.loading ? (
                <Spinner />
              ) : (
                <Icon
                  style={{ tintColor: "black", width: 30, height: 30 }}
                  name="search-outline"
                />
              )}
            </TouchableRipple>
          </Layout>
        </Layout>
        <Layout style={{ marginTop: 15 }} level="3">
          {this.state.users.map((item, index) => (
            <UserObj item={item} key={index} token={this.props.auth.token} />
          ))}
        </Layout>
      </SafeAreaView>
    );
  }
}
const mapStateToProps = (state) => ({ auth: state.secure.auth });
export default connect(mapStateToProps, null)(SearchScreen);
