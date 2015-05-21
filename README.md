# changify

A module to watch and handle DB changes to a user that need verification, like emails or phone numbers.

This module is to be used with the [Uhray Boilerplate](https://github.com/uhray/boilerplate).

* [Overview](#overview)
* [Usage](#usage)
* [JS API](#js-api)
* [URL Routes](#url-routes)

## Overview

This allows you to protect changes to user information before they are verified. The module is built for a pretty specific use-case, so there is not a ton of configuring. Maybe someday it will be more generic.

Basically, here is the order of operations:

  1. User requests change to a value.
  2. Changify stores the change with a specified code.
  3. If a request is made for that specified code to be used, the change will occur in the database.

To use it, you'll need to set up the connection that sends the code to the user (via email, text, etc) and prompts them to make the request referenced in point 3 above.

## Usage

In the Uhray Boilerplate in the API initialization right after the turnkey setup. [This File](https://github.com/uhray/boilerplate/blob/master/app/backend/api/index.js).

```js
  var changify = require('changify');

  // ... other stuff goes on here ...

  // Turnkey setup stuff above ^^^

  // Configure changify
  changify.launch({
    mongoose: mongoose,
    model: resources.users.Model,
    router: app,
    redirect: '/#/account_settings'
  });
  changify.add('email', function(email, cb) {
    resources.users.Model.findOne({ email: email }, function(e, d) {
      cb(e || !d && tools.emailRegex(email));
    });
  }, changify.uuid(), tools.changeEmail);
  changify.add('cell', function(d, cb) {
    cb(Number.isFinite(d));
  }, changify.nums(5), tools.changeCell);


  // Crud launching below ...

```

## JS API

<a href="#launch" name="launch">#</a> changify.**launch**(*options*)

Pass necessary configuration options to changfy.

  * *mongoose* - (required) - Pass the mongoose object. This is to ensure changify uses the same one.
  * *model* - (required) - Pass the Mongoose Users Model.
  * *router* - (required) - Pass the Express router.
  * *redirect* - (default: `'/'`) - The required url after a change has been verified.

<a href="#add" name="add">#</a> changify.**add**(*key*, *validate*, *keygen*, *codeHandler*)

  *key* - (required) - The key on the user object (e.g. `'email'`).
  *validate* - (required) - A function to validate the new value is allows. It's called with `(newValue, callback)` where `callback` expected one boolean argument whether it's valid or not.
  *keygen* - (required) - A key generator. Allows you to specify what type of key you. See below for some packaged with changify.
  *codeHandler* - (required) - A function called when a change is made so you can email the user (or whatever you want to do). It's called with `(code, newValue, user)`, where the `code` is the unique code, the `newValue` is what they're changing it to, and the `user` is this user's Mongoose model.

<a href="#uuid" name="uuid">#</a> changify.**uuid**()

Returns a function that creates a uuid. Used as a *keygen*.

<a href="#uuid" name="uuid">#</a> changify.**nums**(n)

Returns a function that creates a random number *n* digits long. It avoids `1` and `0` to avoid confusion with `I`, `L`, and `O`.

## URL Routes

Changify sets up two URL routes needed for it to work.

  * *POST* `/changify` - Stores a new change
    This expects as the body like this: `{ "key": "email", "value": "mynewemail@gmail.com"}`,

  * *GET* `/changify/:code` - Enacts the change
    If the code is valid, the change is taken into effect. Once a change is made, it will be redirected to the `redirect` url for this key. Alternatively, if you query `/changify/:code?json=true` it will respond with `{ "error": error, "data": true }` where `data` is `true` if a change is made, otherwise `false`.

> Note: stored changes are only valid for 24 hours.

