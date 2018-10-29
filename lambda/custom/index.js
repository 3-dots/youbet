/* eslint-disable  func-names */
/* eslint-disable  no-console */

const Alexa = require('ask-sdk-core');

const LaunchRequestHandler = {
  canHandle(handlerInput) {
    let { request } = handlerInput.requestEnvelope;
    console.log("LaunchRequestHandler: checking if it can handle " + request.type);
    return handlerInput.requestEnvelope.request.type === 'LaunchRequest';
  },
  handle(handlerInput) {

    const { attributesManager, requestEnvelope } = handlerInput;
    const sessionAttributes = attributesManager.getSessionAttributes();

    const speechText = 'Welcome to the Alexa Skills Kit, you can say hello!';

    const response =  handlerInput.responseBuilder
      .speak(speechText)
      .reprompt(speechText)
      .withSimpleCard('Hello World', speechText)
      .getResponse();

      response.directives = response.directives || [];
      response.directives.push(buttonStartInputHandlerDirective);
      sessionAttributes.buttonCount = 0;
      sessionAttributes.CurrentInputHandlerID = requestEnvelope.request.requestId;
      response.directives.push(buildButtonIdleAnimationDirective([], breathAnimationRed));
      response.directives.push(buildButtonDownAnimationDirective([]));
      response.directives.push(buildButtonUpAnimationDirective([]));
      delete response.shouldEndSession;

      return response
  },
};

const HelloWorldIntentHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'IntentRequest'
      && handlerInput.requestEnvelope.request.intent.name === 'HelloWorldIntent';
  },
  handle(handlerInput) {
    const speechText = 'Hello World!';

    return handlerInput.responseBuilder
      .speak(speechText)
      .withSimpleCard('Hello World', speechText)
      .getResponse();
  },
};

const HelpIntentHandler = {
  canHandle(handlerInput) {
    const { request } = handlerInput.requestEnvelope;
    const intentName = request.intent ? request.intent.name : '';
    console.log("main.HelpIntentHandler: checking if it can handle "
        + request.type + " for " + intentName);
    return handlerInput.requestEnvelope.request.type === 'IntentRequest'
      && handlerInput.requestEnvelope.request.intent.name === 'AMAZON.HelpIntent';
  },
  handle(handlerInput) {
    const speechText = "Welcome to the Gadgets Test Skill. " +
            "Press your Echo Buttons to change the lights. " +
            "<audio src='https://s3.amazonaws.com/ask-soundlibrary/foley/amzn_sfx_rhythmic_ticking_30s_01.mp3'/>";

    var response = handlerInput.responseBuilder
      .speak(speechText)
      .reprompt(speechText)
      .withSimpleCard('Hello World', speechText)
      .getResponse();
    delete response.shouldEndSession;
    return response;
  },
};

const CancelAndStopIntentHandler = {
  canHandle(handlerInput) {
    const { request } = handlerInput.requestEnvelope;
   const intentName = request.intent ? request.intent.name : '';
   console.log("main.StopAndCancelIntentHandler: checking if it can handle "
       + request.type + " for " + intentName);
    return handlerInput.requestEnvelope.request.type === 'IntentRequest'
      && (handlerInput.requestEnvelope.request.intent.name === 'AMAZON.CancelIntent'
        || handlerInput.requestEnvelope.request.intent.name === 'AMAZON.StopIntent');
  },
  handle(handlerInput) {
    const { attributesManager } = handlerInput;
   const sessionAttributes = attributesManager.getSessionAttributes();
   var response = handlerInput.responseBuilder
        .speak("Thank you for using the Gadgets Test Skill.  Goodbye. ")
        .getResponse();
  if (sessionAttributes.CurrentInputHandlerID !== undefined) {
      response.directives = response.directives || [];
      response.directives.push(buttonStopInputHandlerDirective(sessionAttributes.CurrentInputHandlerID));
    }
    return response;
  },
};

const DefaultHandler = {
    canHandle(handlerInput) {
        let { request } = handlerInput.requestEnvelope;
        let intentName = request.intent ? request.intent.name : '';
        console.log("main.DefaultHandler: checking if it can handle "
            + request.type + " for " + intentName);
        return true;
    },
    handle(handlerInput) {
        console.log("Global.DefaultHandler: handling request");

        var response = handlerInput.responseBuilder
        .speak("Sorry, I didn't get that. " +
               "Please press your Echo Buttons to change the color of the lights. " +
               "<audio src='https://s3.amazonaws.com/ask-soundlibrary/foley/amzn_sfx_rhythmic_ticking_30s_01.mp3'/>")
        .getResponse();
      delete response.shouldEndSession;
      return response;
    }
  }

const SessionEndedRequestHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'SessionEndedRequest';
  },
  handle(handlerInput) {
    console.log(`Session ended with reason: ${handlerInput.requestEnvelope.request.reason}`);

    return handlerInput.responseBuilder.getResponse();
  },
};

const ErrorHandler = {
  canHandle() {
    let { request } = handlerInput.requestEnvelope;
        console.log("main.ErrorHandler: checking if it can handle "
            + request.type + ": [" + error.name + "] -> " + !!error.name);
    return true;
  },
  handle(handlerInput, error) {
    console.log(`Error handled: ${error.message}`);

    return handlerInput.responseBuilder
      .speak('Sorry, I can\'t understand the command. Please say again.')
      .reprompt('Sorry, I can\'t understand the command. Please say again.')
      .getResponse();
  },
};

const GameEngineInputHandler = {
    canHandle(handlerInput) {
      let { request } = handlerInput.requestEnvelope;
      console.log("main.GameEngineInputHandler: checking if it can handle " + request.type);
      return request.type === 'GameEngine.InputHandlerEvent';
    },
    handle(handlerInput) {
      console.log('Received game event');
      let { attributesManager } = handlerInput;
      let request = handlerInput.requestEnvelope.request;
      const sessionAttributes = attributesManager.getSessionAttributes();
      if (request.originatingRequestId !== sessionAttributes.CurrentInputHandlerID) {
          console.log("Global.GameEngineInputHandler: stale input event received -> "
                      +"received event from " + request.originatingRequestId
                      +" (was expecting " + sessionAttributes.CurrentInputHandlerID + ")");
          return handlerInput.responseBuilder.getResponse();
      }

      var gameEngineEvents = request.events || [];
      for (var i = 0; i < gameEngineEvents.length; i++) {
        let buttonId;

        /*
          In this request type, we'll see one or more incoming events that
          correspond to the StartInputHandler directive we sent above.
        */
        switch (gameEngineEvents[i].name) {
          case 'button_down_event': {

            // ID of the button that triggered the event.
            buttonId = gameEngineEvents[i].inputEvents[0].gadgetId;

            // Recognize a new button.
            let isNewButton = false;
            if (sessionAttributes[buttonId + '_initialized'] === undefined) {
              isNewButton = true;
              sessionAttributes.buttonCount += 1;

              sessionAttributes[buttonId + '_initialized'] = true;
            }

            let response = handlerInput.responseBuilder.getResponse();

            if (isNewButton) {
              // Say something when we first encounter a button.
              response = handlerInput.responseBuilder
                .speak("Hello button " + sessionAttributes.buttonCount + ". " +
                       "Good to see you." +
                       "<audio src='https://s3.amazonaws.com/ask-soundlibrary/foley/amzn_sfx_rhythmic_ticking_30s_01.mp3'/>")
                .getResponse();
                response.directives = [];
              /*
                This is a new button, as in new to our understanding.
                Because this button may have just woken up, it may not have
                received the initial animations during the launch intent.
                We'll resend the animations here, but instead of the empty array
                broadcast above, we'll send the animations ONLY to this buttonId.
              */
              response.directives.push(buildButtonIdleAnimationDirective([buttonId], breathAnimationRed));
              response.directives.push(buildButtonDownAnimationDirective([buttonId]));
              response.directives.push(buildButtonUpAnimationDirective([buttonId]));
            }

            // Again, this means don't end the session, and don't open the microphone.
            delete response.shouldEndSession;
            return response;
          }
          case 'button_up_event': {
            buttonId = gameEngineEvents[i].inputEvents[0].gadgetId;

            /*
              On releasing the button, we'll replace the 'none' animation
              with a new color from a set of animations.
            */
            let newAnimationIndex = ((attributes, buttonId, maxLength) => {
              let index = 1;

              if (attributes[buttonId] !== undefined) {
                let newValue = attributes[buttonId] + 1;
                if (newValue >= maxLength) {
                  newValue = 0;
                }
                index = newValue;
              }

              attributes[buttonId] = index;

              return index;
            })(sessionAttributes, buttonId, animations.length);

            let newAnimation = animations[newAnimationIndex];

            let response = handlerInput.responseBuilder.getResponse();
            response.directives = [buildButtonIdleAnimationDirective([buttonId], newAnimation)];
            delete response.shouldEndSession;
            return response;
          }
          case 'timeout': {

            // The timeout of our InputHandler was reached.  Let's close the Skill session.
            if (sessionAttributes.buttonCount == 0) {
              return handlerInput.responseBuilder
                .speak("I didn't detect any buttons. " +
                       "You must have at least one Echo Button to use this skill.  Goodbye. ")
                .getResponse();
            } else {
              return handlerInput.responseBuilder
                .speak("Thank you for using the Gadgets Test Skill.  Goodbye. ")
                .getResponse();
            }
          }
        }
      }
    }
  }



const ResponseInterceptor = {
    process(handlerInput) {
        /* a response interceptor alows us one more chance to process any response
           from the skill before sending it back to Alexa. In this interceptor we
           simplay log both the Response element as well as any SessionAttributes */
        let {attributesManager, responseBuilder} = handlerInput;
        console.log("main.ResponseInterceptor: post-processing response");

        let response = responseBuilder.getResponse();

        console.log(`==Response==${JSON.stringify(response)}`);
        console.log(`==SessionAttributes==${JSON.stringify(attributesManager.getSessionAttributes())}`);

        return response;
    }
  }



const buildBreathAnimation = function(fromRgbHex, toRgbHex, steps, totalDuration) {
   const halfSteps = steps / 2;
   const halfTotalDuration = totalDuration / 2;
   return buildSeqentialAnimation(fromRgbHex, toRgbHex, halfSteps, halfTotalDuration)
     .concat(buildSeqentialAnimation(toRgbHex, fromRgbHex, halfSteps, halfTotalDuration));
 }

 const buildSeqentialAnimation = function(fromRgbHex, toRgbHex, steps, totalDuration) {
   const fromRgb = parseInt(fromRgbHex, 16);
   let fromRed = fromRgb >> 16;
   let fromGreen = (fromRgb & 0xff00) >> 8;
   let fromBlue = fromRgb & 0xff;

   const toRgb = parseInt(toRgbHex, 16);
   const toRed = toRgb >> 16;
   const toGreen = (toRgb & 0xff00) >> 8;
   const toBlue = toRgb & 0xff;

   const deltaRed = (toRed - fromRed) / steps;
   const deltaGreen = (toGreen - fromGreen) / steps;
   const deltaBlue = (toBlue - fromBlue) / steps;

   const oneStepDuration = Math.floor(totalDuration / steps);

   const result = [];

   for (let i = 0; i < steps; i++) {
     result.push({
       "durationMs": oneStepDuration,
       "color": rgb2h(fromRed, fromGreen, fromBlue),
       "blend": true
     });
     fromRed += deltaRed;
     fromGreen += deltaGreen;
     fromBlue += deltaBlue;
   }

   return result;
 }

 const rgb2h = function(r, g, b) {
   return '' + n2h(r) + n2h(g) + n2h(b);
 }
 // Number to hex with leading zeros.
 const n2h = function(n) {
   return ('00' + (Math.floor(n)).toString(16)).substr(-2);
 }

 const breathAnimationRed = buildBreathAnimation('552200', 'ff0000', 30, 1200);
 const breathAnimationGreen = buildBreathAnimation('004411', '00ff00', 30, 1200);
 const breathAnimationBlue = buildBreathAnimation('003366', '0000ff', 30, 1200);
 const animations = [breathAnimationRed, breathAnimationGreen, breathAnimationBlue];

 /*
   Build a 'button down' animation directive.
   The animation will overwrite the default 'button down' animation.
 */
 const buildButtonDownAnimationDirective = function(targetGadgets) {
   return {
     "type": "GadgetController.SetLight",
     "version": 1,
     "targetGadgets": targetGadgets,
     "parameters": {
       "animations": [{
         "repeat": 1,
         "targetLights": ["1"],
         "sequence": [{
           "durationMs": 300,
           "color": "FFFF00",
           "blend": false
         }]
       }],
       "triggerEvent": "buttonDown",
       "triggerEventTimeMs": 0
     }
   }
 };

 // Build a 'button up' animation directive.
 const buildButtonUpAnimationDirective = function(targetGadgets) {
   return {
     "type": "GadgetController.SetLight",
     "version": 1,
     "targetGadgets": targetGadgets,
     "parameters": {
       "animations": [{
         "repeat": 1,
         "targetLights": ["1"],
         "sequence": [{
           "durationMs": 300,
           "color": "00FFFF",
           "blend": false
         }]
       }],
       "triggerEvent": "buttonUp",
       "triggerEventTimeMs": 0
     }
   }
 };

 // Build an idle animation directive.
 const buildButtonIdleAnimationDirective = function(targetGadgets, animation) {
   return {
     "type": "GadgetController.SetLight",
     "version": 1,
     "targetGadgets": targetGadgets,
     "parameters": {
       "animations": [{
         "repeat": 100,
         "targetLights": ["1"],
         "sequence": animation
       }],
       "triggerEvent": "none",
       "triggerEventTimeMs": 0
     }
   }
 };

 const buttonStartInputHandlerDirective = {
  "type": "GameEngine.StartInputHandler",
  "timeout": 30000, // In milliseconds.
  "recognizers": {  // Defines which Button Presses your Skill would like to receive as events.
    "button_down_recognizer": {
      "type": "match",
      "fuzzy": false,
      "anchor": "end",
      "pattern": [{
        "action": "down"
      }]
    },
    "button_up_recognizer": {
      "type": "match",
      "fuzzy": false,
      "anchor": "end",
      "pattern": [{
        "action": "up"
      }]
    }
  },
  "events": {  // These events will be sent to your Skill in a request.
    "button_down_event": {
      "meets": ["button_down_recognizer"],
      "reports": "matches",
      "shouldEndInputHandler": false
    },
    "button_up_event": {
      "meets": ["button_up_recognizer"],
      "reports": "matches",
      "shouldEndInputHandler": false
    },
    "timeout": {
      "meets": ["timed out"],
      "reports": "history",
      "shouldEndInputHandler": true
    }
  }
};

 /*
    Called when closing the Skill if an InputHandler is active.  We can do this
    because we kept the requestId when we started this InputHandler.  It's always
    a good idea to clean up when your Skill's session ends.
 */
 const buttonStopInputHandlerDirective = function(inputHandlerOriginatingRequestId) {
   return {
     "type": "GameEngine.StopInputHandler",
     "originatingRequestId": inputHandlerOriginatingRequestId
   }
 };






const skillBuilder = Alexa.SkillBuilders.custom();

exports.handler = skillBuilder
  .addRequestHandlers(
    LaunchRequestHandler,
    GameEngineInputHandler,
    HelloWorldIntentHandler,
    HelpIntentHandler,
    CancelAndStopIntentHandler,
    SessionEndedRequestHandler,
    DefaultHandler
  )
  .addResponseInterceptors(ResponseInterceptor)
  .addErrorHandlers(ErrorHandler)
  .lambda();
