import React, {Component} from 'react';
import { StyleSheet, View, Text, Animated, Easing, Dimensions, PanResponder, BackHandler, Platform } from 'react-native';
import { slideTransitionDefinition, fadeTransitionDefinition } from './TransitionDefinitions'

export default class SimpleNavigator extends Component<Props> { 

  constructor(props) {
    super(props);
    this.screenRefs = [];
    const stack = [];

    if (this.props.firstScreen) {
      var screenKey = this.props.firstScreen.name + '_' + stack.length;
      const Screen = this.props.navigatorConfig[this.props.firstScreen];
      const NewScreen = 
      <Screen
        ref={ (r) => { this.screenRefs[screenKey] = r } }
        key={ screenKey }
        counter={0} 
        push={this.push}  
        pop={this.pop}
      />
      stack.push({ component: NewScreen, key: screenKey}); //, transitionStyle: slideTransitionDefinition() 
     
    }

    this.state = {
      stack: stack,
      transitioning: false,
      navigatingBack: false,
      firstTime: true,
    }
  }

  componentDidMount() {
    this.animateNavigatorTransition();
    if (Platform.OS === 'android') {
       BackHandler.addEventListener('hardwareBackPress', this.handleBackPress);
    }
  }

  componentWillUnmount(){
    if (Platform.OS === 'android') {
      BackHandler.removeEventListener('hardwareBackPress', this.handleBackPress);
    }
  }

  componentDidUpdate() {
    this.animateNavigatorTransition();
  }

  handleBackPress = () => {

    if (Platform.OS !== 'android') {
      return;
    }

    const { stack } = this.state;

    if (stack.length > 1) {
      this.pop();
      return true;
    }

    return false;
  }

  animateNavigatorTransition() {
    const { transitioning, navigatingBack, topScreenAnimation, secondScreenAnimation, stack, resetStack }  = this.state;

    const topmost = stack[stack.length-1];

    if (transitioning ) {

      const topScreenRef = this.screenRefs[stack[stack.length-1].key];
      const secondScreenRef = this.screenRefs[stack[stack.length-2].key];

      if (navigatingBack) {
        
        // Lifecycle methods
        if (topScreenRef && topScreenRef.willDisappear) {
          topScreenRef.willDisappear()
        }
        if (secondScreenRef && secondScreenRef.willAppear) {
          secondScreenRef.willAppear();
        }

        topmost.transitionStyle.animateTransition(navigatingBack, () => {
          // Lifecycle methods
          if (topScreenRef && topScreenRef.didDisappear) {
            topScreenRef.didDisappear();
          }

          if (secondScreenRef && secondScreenRef.didAppear) {
            secondScreenRef.didAppear();
          }

          if (stack.length > 1) {
            const screen = stack.pop();
            if (screen) {
              delete this.screenRefs[screen.key];
            }
          }
          this.setState({ stack: stack, transitioning: false, navigatingBack: false, firstTime: false});
        })

      } else { 
        // Lifecycle methods
        if (topScreenRef && topScreenRef.willAppear) {
          topScreenRef.willAppear();
        }

        if (secondScreenRef && secondScreenRef.willDisappear) {
          secondScreenRef.willDisappear();
        }

        topmost.transitionStyle.animateTransition(navigatingBack, () => {
          // Lifecycle methods
          if (topScreenRef.didAppear) {
            topScreenRef.didAppear()
          }
          if (secondScreenRef.didDisappear) {
            secondScreenRef.didDisappear();
          }

          var newState = { transitioning: false, navigatingBack: false, firstTime: false }

          if (resetStack) {
            const newStack = [ stack[stack.length-1] ];
            newState.stack = newStack;
          }

          this.setState(newState);
        })
      }
    }
  }

  push = (screen, transitionDefinition='ios', props={}, resetStack=false) => {
    const { stack, transitioning } = this.state;
    // Avoid pushing new screen while this previous one is transitioning
    if (transitioning) { return; }

    const Screen = this.props.navigatorConfig[screen];
    if (!Screen) {
      return;
    }

    var screenKey = screen + '_' + stack.length;

    const NewScreen = 
    <Screen 
      ref={ (r) => { this.screenRefs[screenKey] = r; }}
      key={ screenKey }
      { ...props } 
      push={this.push}  
      pop={this.pop}
    />

    var transitionStyle = { } ;
    if (transitionDefinition === 'ios') {
      transitionStyle = slideTransitionDefinition();
    } else if (transitionDefinition === 'fade') {
      transitionStyle = fadeTransitionDefinition();
    } else if (transitionDefinition.topScreenAnimation && 
               transitionDefinition.backScreenAnimation &&
               transitionDefinition.topmostScreenAnimationProps &&
               transitionDefinition.backScreenAnimationProps &&
               transitionDefinition.animateTransition) {
      transitionStyle = transitionDefinition;
    }

    // if (transitionStyle.swipeEnabled) {
      
    // }

    stack.push({ component: NewScreen, key: screenKey, transitionStyle: transitionStyle});
    this.setState({ stack: stack, transitioning: true, navigatingBack: false, resetStack: resetStack})
  }

  pop = () => {
    const { stack, transitioning } = this.state;
    
    if (transitioning || stack.length === 1) { // Avoid poping new screen while one is transitioning
      return;
    }

    this.setState({ transitioning: true, navigatingBack: true}) 
  }

  render() {
    const { stack, navigatingBack, transitioning } = this.state;
    const topmost = stack[stack.length-1];

    // this._panResponder = topmost.transitionStyle.setupSwipeResponder(() => {
    //   if (stack.length > 1) {
    //     const screen = stack.pop();
    //     if (screen) {
    //       delete this.screenRefs[screen.key];
    //     }
    //   }
    //   this.setState({ stack: stack });
    // })

    const renderStack = stack.map(  (screen, index) => { 

      if(!transitioning) {
        const screenView =
          <Animated.View key={screen.key} style={styles.screenContainer}>
            {screen.component}
          </Animated.View>
        return screenView
      }

      if (index === stack.length - 2 && stack.length > 1 ) { // Previous screen
        const animatedScreen = 
          <Animated.View  
            key={screen.key} style={[styles.screenContainer, {...topmost.transitionStyle.backScreenAnimationProps() }]}>
            { screen.component }
          </Animated.View>
        return animatedScreen;

      } else if (index === stack.length-1 && stack.length > 1) { // // New Screen 
        const animatedScreen =  
          <Animated.View 
            key={screen.key} 
            style={[styles.screenContainer, {...topmost.transitionStyle.topmostScreenAnimationProps() }]}>
            {screen.component}
          </Animated.View>
        return animatedScreen;

      } else {
        const screenView =
          <Animated.View
            key={screen.key} 
            style={styles.screenContainer}>
            {screen.component}
          </Animated.View>
        return screenView
      }
    })

    return(
      <View style={styles.container}>
        { renderStack }
      </View>
    )
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'white',
  },
  screenContainer: {
    position:'absolute', top: 0, bottom:0, right:0, left: 0,
  },
  panResponderView: {
    position:'absolute', flex: 1, width: '100%', height: '100%', //top: 0, bottom:0, right:0, left: 0,
    backgroundColor: 'blue'
  }
})