import {  Animated, Easing, Dimensions, PanResponder } from 'react-native';

export function slideTransitionDefinition (config={})  {
  const duration = config.duration ? config.duration : 400;
  const direction = config.direction ? config.direction : 1;
  const isVertical = config.isVertical ? config.isVertical : false;
  const backScreenOffset = config.backScreenOffset !== undefined ? config.backScreenOffset : (!isVertical ? Dimensions.get('window').width*0.4 : 0) 
  const initialPositionTop = config.initialPositionTop ? config.initialPositionTop : (!isVertical ? Dimensions.get('window').width : Dimensions.get('window').height)
  const initialPositionBack = config.initialPositionBack ? config.initialPositionBack : 0;

  return {
    topScreenAnimation: !isVertical ? new Animated.ValueXY({x: initialPositionTop, y: 0}) :  new Animated.ValueXY({x: 0, y: initialPositionTop}),
    backScreenAnimation: new Animated.ValueXY({ x: 0, y: 0 }),

    topmostScreenAnimationProps: function() {
      return { transform: this.topScreenAnimation.getTranslateTransform() }
    },

    backScreenAnimationProps: function() {
      return { transform: this.backScreenAnimation.getTranslateTransform() }
    },

    animateTransition: function(isNavigatingBack, animFinishedCallback) {
      // Initial animated values
      const topStartValue = isNavigatingBack ? 
        { x: 0, y: 0 } : 
        (!isVertical ? 
          { x: direction*Dimensions.get('window').width, y: 0 } : 
          { x: 0, y: direction*Dimensions.get('window').height }
        );

      const value = -1*direction*backScreenOffset;
      const backStartValue = isNavigatingBack ? 
      (!isVertical ? 
        { x: value, y: 0 } : 
        { x: 0 , y: value }
      ) : { x: 0, y: 0 } ;
      this.topScreenAnimation.setValue( topStartValue );
      this.backScreenAnimation.setValue( backStartValue );

      // To animated values
      //Dimensions.get('window').width : 0;
      const toValueTop = isNavigatingBack ? 
      ( !isVertical ? 
        { x: direction*Dimensions.get('window').width, y: 0 } : 
        { x: 0, y: direction*Dimensions.get('window').height }
      ) : { x: 0, y:0 } ;

      const toValueBack = isNavigatingBack ? 
      { x:0, y: 0 } :
      ( !isVertical ? 
        { x: (-1 * direction * backScreenOffset), y: 0 } :
        { x: 0, y: (-1 * direction * backScreenOffset) }
      ) 

      //console.log("TO VALUE BACK", toValueBack, direction, backScreenOffset);

      Animated.parallel([
        Animated.timing(this.topScreenAnimation, {
          toValue: toValueTop,
          easing: Easing.linear,
          duration: duration,
          useNativeDriver: true
        }),
        Animated.timing(this.backScreenAnimation, {
          toValue: toValueBack,
          easing: Easing.linear,
          duration: duration,
          useNativeDriver: true
        })
      ])
      .start( () => {
        animFinishedCallback();
      })
    }
  }
}


export function fadeTransitionDefinition(duration=250) {
  return {
    topScreenAnimation: new Animated.Value(1),
    backScreenAnimation: new Animated.Value(0),

    topmostScreenAnimationProps: function() {
      return { opacity: this.topScreenAnimation }
    },

    backScreenAnimationProps: function() {
      return { opacity: this.backScreenAnimation }
    },

    animateTransition: function(isNavigatingBack, animFinishedCallback) {
      // Initial animated values
      this.topScreenAnimation.setValue( isNavigatingBack ? 1.0 : 0.0  );
      this.backScreenAnimation.setValue( isNavigatingBack ? 0.0 : 1.0  );

      // To animated values
      const toValueTop = isNavigatingBack ? 0.0 : 1.0;
      const toValueSecond = isNavigatingBack ? 1.0 : 0.0;

      Animated.parallel([
        Animated.timing(this.topScreenAnimation, {
          toValue: toValueTop,
          easing: Easing.linear,
          duration: duration,
          useNativeDriver: true
        }),
        Animated.timing(this.backScreenAnimation, {
          toValue: toValueSecond,
          easing: Easing.linear,
          duration: duration,
          useNativeDriver: true
        })
      ])
      .start( () => {
        animFinishedCallback();
      })
    },
  }
}