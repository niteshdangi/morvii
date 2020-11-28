import React, { Component } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { Icon, Layout, Spinner, Text } from "@ui-kitten/components";
import { TouchableRipple, TextInput } from "react-native-paper";
import StoryView from "./home/stories";
import * as Constants from "./Constants";
import { connect } from "react-redux";
import Trending from "./home/trending";
import Recommendations from "./home/recommendations";
import { FlatList, Dimensions, RefreshControl, Image } from "react-native";
import { ScrollView } from "react-native-gesture-handler";
import StoryItem from "./utils/StoryItem";
import { setShortModal, setShortModalProps } from "../actions/ShortModal";
import Ripple from "react-native-material-ripple";
import ScrollRefreshView from "./utils/ScrollRefreshView";
function wait(timeout) {
  return new Promise((resolve) => {
    setTimeout(resolve, timeout);
  });
}
class ExploreScreen extends Component {
  width = Dimensions.get("window").width;
  state = {
    exploreData: [],
    refreshing: false,
    trends: true,
    storyLoad: true,
    stories: [],
    hashTrends: [],
  };
  RefreshControl_ = React.createRef();
  setRefreshing = (refreshing) => {
    this.setState({ ...this.state, refreshing, trends: true });
  };

  onRefresh = () => {
    // this.setRefreshing(true);
    this.fetchStories();
  };
  shouldComponentUpdate(p, s) {
    if (
      this.state.trends != s.trends ||
      this.state.refreshing != s.refreshing ||
      this.state.stories.length != s.stories.length ||
      this.state.storyLoad != s.storyLoad
    )
      return true;
    return false;
  }
  hideTrends() {
    this.setState({ trends: false });
  }
  componentDidMount() {
    this.fetchStories();
  }
  fetchStories() {
    fetch(Constants.API_URL + "/story/home/", {
      method: "GET",
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
          storyLoad: false,
          stories: data.story,
          refreshing: false,
        });
        this.RefreshControl_.current?.stop();
      })
      .catch(() => {
        this.RefreshControl_.current?.stop();
        this.setState({ storyLoad: false, refreshing: false });
      });
  }
  render() {
    return (
      <Layout style={{ flex: 1, backgroundColor: "#fff" }}>
        <SafeAreaView style={{ flex: 1 }}>
          <Layout
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              padding: 10,
              elevation: 1,
              zIndex: 999999,
            }}>
            <Layout
              style={{
                flexDirection: "row",
                justifyContent: "center",
                alignItems: "center",
              }}>
              {/* <StoryView size={35} borderColor="white" /> */}
              <Image
                source={require("../../assets/logo.png")}
                resizeMode="contain"
                style={{ width: 50, height: 40 }}
              />
              <Text style={{ marginLeft: 10 }} category="h4">
                Explore
              </Text>
            </Layout>
            <Layout
              style={{
                flexDirection: "row",
                justifyContent: "center",
                alignItems: "center",
              }}>
              <TouchableRipple
                onPress={() =>
                  this.props.navigation.navigate("CameraGallery", {
                    type: "STORY",
                    postStory: this.props.route.params.story.post,
                  })
                }
                style={{ padding: 5 }}>
                <Icon
                  style={{ tintColor: "black", width: 30, height: 30 }}
                  name="video-outline"
                />
              </TouchableRipple>
              <TouchableRipple
                onPress={() => this.props.navigation.navigate("SearchScreen")}
                style={{ padding: 5 }}>
                <Icon
                  style={{ tintColor: "black", width: 30, height: 30 }}
                  name="search-outline"
                />
              </TouchableRipple>
            </Layout>
          </Layout>
          <ScrollRefreshView
            ref={this.RefreshControl_}
            style={{ flex: 1, flexGrow: 1 }}
            onRefresh={() => {
              this.onRefresh();
            }}
            onScroll={(e) => {}}
            releaseDelay={1}
            onRelease={() => {}}
            onRefreshScroll={(e) => {}}>
            {this.state.storyLoad ? (
              <Layout
                style={{
                  padding: 15,
                  justifyContent: "center",
                }}>
                <Spinner />
              </Layout>
            ) : (
              <FlatList
                horizontal={true}
                data={this.state.stories}
                ListEmptyComponent={
                  <Layout
                    style={{
                      justifyContent: "center",
                      alignItems: "center",
                      height: 50,
                      width: Dimensions.get("screen").width,
                    }}>
                    <Text>Stories will appear here!</Text>
                  </Layout>
                }
                renderItem={({ item, index }) => {
                  return (
                    <StoryItem
                      key={index}
                      onPress={() =>
                        this.props.setShortModal(true, "StoryView", {
                          story: this.state.stories,
                          index: index,
                        })
                      }
                      item={item}
                      style={{ margin: 5 }}
                    />
                  );
                }}
              />
            )}
            {this.state.trends && (
              <Layout>
                <Text category="h5" style={{ margin: 10 }}>
                  Trending
                </Text>
                <ScrollView
                  showsHorizontalScrollIndicator={false}
                  horizontal={true}>
                  <Trending
                    hideTrends={this.hideTrends.bind(this)}
                    hashTrends={(ht) => {
                      this.setState({ hashTrends: ht });
                    }}
                    navigation={this.props.navigation}
                  />
                </ScrollView>
              </Layout>
            )}
            <Layout>
              <ScrollView
                style={{ paddingHorizontal: 10, paddingTop: 20 }}
                horizontal
                showsHorizontalScrollIndicator={false}>
                {this.state.hashTrends.map((item, index) => {
                  return <Hash tag={item + ""} />;
                })}
              </ScrollView>
            </Layout>
            <Layout>
              <Text category="h5" style={{ margin: 10, marginTop: 20 }}>
                Recommendations
              </Text>
              <Recommendations navigation={this.props.navigation} />
            </Layout>
          </ScrollRefreshView>
        </SafeAreaView>
      </Layout>
    );
  }
}
const mapStateToProps = (state) => ({
  auth: state.secure.auth,
});

export default connect(mapStateToProps, { setShortModal, setShortModalProps })(
  ExploreScreen
);
const Hash = ({ tag }) => (
  <Ripple
    style={{
      elevation: 3,
      paddingHorizontal: 15,
      paddingVertical: 10,
      borderRadius: 100,
      borderWidth: 1,
      borderColor: "rgba(0,0,0,0.5)",
      justifyContent: "center",
      alignItems: "center",
      marginBottom: 5,
      backgroundColor: "#fff",
      overflow: "hidden",
      marginRight: 10,
    }}>
    <Text>#{tag}</Text>
  </Ripple>
);
