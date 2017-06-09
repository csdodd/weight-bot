const Bot = require('./lib/Bot')
const SOFA = require('sofa-js')
const Fiat = require('./lib/Fiat')

let bot = new Bot()

// ROUTING

bot.onEvent = function(session, message) {
  switch (message.type) {
    case 'Init':
      sendWelcomeMessage(session)
      break
    case 'Message':
      onMessage(session, message)
      break
    case 'Command':
      onCommand(session, message)
      break
    case 'Payment':
      onPayment(session, message)
      break
    case 'PaymentRequest':
      sendWelcomeMessage(session)
      break
  }
}

function onMessage(session, message) {
  if (sessionIsActive(session)) {
    sendSessionStatus(session)
  } else {
    sendWelcomeMessage(session)
  }
}

function sessionIsActive(session) {
  let endOfSession = new Date((session.get('endDate') || null))
  return endOfSession != null && new Date() < endOfSession
}

function onCommand(session, command) {
  switch (command.content.value) {

    // Welcome commands
    case 'welcome_learnMore':
        sendLearnMore(session);
        break;
    case 'welcome_getStarted':
        sendSessionStart(session);
        break;

    // Session Length commands
    case 'sessionEnd_1':
      setEndDate(session, 1)
      sendSetActivityAmount(session)
      break
    case 'sessionEnd_7':
      setEndDate(session, 7)
      sendSetActivityAmount(session)
      break
    case 'sessionEnd_28':
      setEndDate(session, 28)
      sendSetActivityAmount(session)
      break

    // Activity amount commands
    case 'activityAmount1':
      setActivityAmount(session, 1)
      sendPaymentAmount(session)
      break
    case 'activityAmount2':
      setActivityAmount(session, 2)
      sendPaymentAmount(session)
      break
    case 'activityAmount3':
      setActivityAmount(session, 3)
      sendPaymentAmount(session)
      break
    case 'activityAmount4':
      setActivityAmount(session, 4)
      sendPaymentAmount(session)
      break
    case 'activityAmount5':
      setActivityAmount(session, 5)
      sendPaymentAmount(session)
      break

    // Activity amount commands
    case 'paymentAmount1':
      sendPaymentRequest(session, 1)
      break
    case 'paymentAmount5':
      sendPaymentRequest(session, 5)
      break
    case 'paymentAmount10':
      sendPaymentRequest(session, 10)
      break
    case 'paymentAmount20':
      sendPaymentRequest(session, 20)
      break
    case 'paymentAmount100':
      sendPaymentRequest(session, 100)
      break

    // Session
    case 'status__checkstatus':
      sendSessionStatus(session)
      break
    case 'status__newsession':
      setHasExercised(session)
      break
    }
}

function onPayment(session, message) {
  if (message.fromAddress == session.config.paymentAddress) {
    // handle payments sent by the bot
    if (message.status == 'confirmed') {
      // perform special action once the payment has been confirmed
      // on the network
    } else if (message.status == 'error') {
      // oops, something went wrong with a payment we tried to send!
    }
  } else {
    // handle payments sent to the bot
    if (message.status == 'unconfirmed') {
      // payment has been sent to the ethereum network, but is not yet confirmed
      setPaymentAmount(session, message.ethValue)
      sendSessionStatus(session)
    } else if (message.status == 'confirmed') {
      // handle when the payment is actually confirmed!
    } else if (message.status == 'error') {
      sendMessage(session, `There was an error with your payment!🚫`);
    }
  }
}
// STATES

// WELCOME
function sendWelcomeMessage(session) {
  let message = "💪 Welcome to Wager Weight. The app that will incentivise you to exercise regularly.";
  let controls = [
    {type: 'button', label: '🤓 Learn More', value: 'welcome_learnMore'},
    {type: 'button', label: '🏋️ Get Started', value: 'welcome_getStarted'}
  ]
  session.reply(SOFA.Message({
    body: message,
    controls: controls,
    showKeyboard: false,
  }))
}

function sendLearnMore(session) {

  sendMessage(session, `The concept is simple. You choose a length of time, decide how much you want to exercise, then pay an amount.

If you exercise as much as planned to, you get your money back 👊
If you don't succeed then your money is gone 👋💸

It's completely up to you how you use Wager Weight, but remember:

Discipline is doing what needs to be done, even if you don't want to.`)

  sendSessionStart(session, "To get started, you need to choose when the exercise period should end:")
}

// SESSION LENGTH
function sendSessionStart(session, message) {
  if (message == null) {
    message = "When should the exercise period end?"
  }

  let controls = [
    {type: 'button', label: 'Tomorrow', value: 'sessionEnd_1'},
    {type: 'button', label: 'Next week', value: 'sessionEnd_7'},
    {type: 'button', label: 'Four weeks', value: 'sessionEnd_28'}
  ]
  session.reply(SOFA.Message({
    body: message,
    controls: controls,
    showKeyboard: false,
  }))
}

// ACTIVITY AMOUNT
function sendSetActivityAmount(session) {
  let message = "How many times do you want to exercise during this period?"
  let controls = [
    {type: 'button', label: '1', value: 'activityAmount1'},
    {type: 'button', label: '2', value: 'activityAmount2'},
    {type: 'button', label: '3', value: 'activityAmount3'},
    {type: 'button', label: '4', value: 'activityAmount4'},
    {type: 'button', label: '5+', value: 'activityAmount5'},
  ]
  session.reply(SOFA.Message({
    body: message,
    controls: controls,
    showKeyboard: false,
  }))
}

// PAYMENT AMOUNT
function sendPaymentAmount(session) {
  let message = "How much do you want to wager?"
  let controls = [
    {type: 'button', label: '😬 $1', value: 'paymentAmount1'},
    {type: 'button', label: '😅 $5', value: 'paymentAmount5'},
    {type: 'button', label: '💪 $10', value: 'paymentAmount10'},
    {type: 'button', label: '👊 $20', value: 'paymentAmount20'},
    {type: 'button', label: '🏆 $100', value: 'paymentAmount100'},
  ]
  session.reply(SOFA.Message({
    body: message,
    controls: controls,
    showKeyboard: false,
  }))
}

function sendSessionStatus(session) {
  let endOfSession = new Date((session.get('endDate') || null))
  var prettyEndDate = endOfSession.getDate()  + "-" + (endOfSession.getMonth()+1) + " " + endOfSession.getHours() + ":" + (endOfSession.getMinutes()<10?'0':'') + endOfSession.getMinutes();
  let amountOfActivities = (session.get('numActivities') || 0)
  let amountWagered = (session.get('paymentAmount') || 0)
  let rightWord = amountOfActivities == 1 ? "time" : "times"

  if (amountOfActivities == 0 || !sessionIsActive(session)) {
    handleSessionEnd(session, endOfSession, amountOfActivities, amountWagered)
  } else {
    let message = `The session runs until ${prettyEndDate}. In that time you need to exercise ${amountOfActivities} ${rightWord}. If you do, you'll get back ${amountWagered} ETH 🙏`
    let controls = [
      {type: 'button', label: '😅 Log an exercise session', value: 'status__newsession'},
      {type: 'button', label: '😅 Check the status', value: 'status__checkstatus'},
    ]
    session.reply(SOFA.Message({
      body: message,
      controls: controls,
      showKeyboard: false,
    }))
  }
}


function handleSessionEnd(session, endOfSession, amountOfActivities, amountWagered) {
  if (amountOfActivities == 0) {
    sendSuccess(session, amountWagered)
  } else {
    sendFailure(session)
  }
  clearSession(session)
}

function sendSuccess(session, amountWagered) {
  sendMessage(session, "💪👊🏆😎💥 You made it! Congratulations!")
  session.sendEth(amountWagered)
}

function sendFailure(session) {
  sendMessage(session, "😥😥😥😥😥 You didn't make it. Don't be so hard on yourself though. You'll manage it next time 💪")
}

function clearSession(session) {
  setEndDate(session, 0)
  setActivityAmount(0)
  setPaymentAmount(0)
}

// STORAGE

function setEndDate(session, numDays) {
  let endDate = new Date(new Date().getTime() + (numDays * 24 * 60 * 60 * 1000));
  session.set('endDate', endDate)
}

function setActivityAmount(session, numActivities) {
  session.set('numActivities', numActivities)
}

function setPaymentAmount(session, paymentAmount) {
  session.set('paymentAmount', paymentAmount)
}

function setHasExercised(session) {
  if (sessionIsActive(session)) {
    let count = (session.get('numActivities') || 1) - 1
    session.set('numActivities', count)
  }
  sendSessionStatus(session)
}

// MESSAGE SENDING

function sendMessage(session, message) {
  session.reply(SOFA.Message({
    body: message,
    showKeyboard: false,
  }))
}

function sendPaymentRequest(session, usdAmount) {
  // request $1 USD at current exchange rates
  Fiat.fetch().then((toEth) => {
    session.requestEth(toEth.USD(usdAmount))
  })
}
