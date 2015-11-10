# zui

A UI Framework for H5 Single Page App

[Demo](http://zui.wangdahoo.com/examples/intro/index.html)

## API v1.0.0

### Engine

##### create an engine
- Use this method to create global app instance, who is responsible for routes in a Single Page Application.

```
  var app = zui.Engine();
  app.init({                          // init engine with a routes map
      routes: {                       // { [String routeName]:  [zui.Page page], ... }
          master: masterPage,
          detail: detailPage,
      },
      defaultRoute: 'master'
  });
```
  
##### route navigation

```
app.navigate('master');             // navigate to a page by route 'master'.
app.navigate('master', {            // navigate to a page with routeName & routeParams
  id: 123,
  message: 'Come back!'
});
app.navigate('master', {            // navigate to a page with routeName, routeParams & transition.
    id: 123,
    msg: 'May I have a cigarette?'
}, 'back');
```

#### start() & back()

```
app.start();                        // call navigate() with the defaultRoute.
app.back();                         // navigate to the last page by history.
```

#### timer operation

```
var count = 0;
var tid = setInterval(function() {
  console.log(count++);
}, 1000);
app.addTimer(tid);                  // mark down a timer id, and the timer will be eliminated automatically
                                    // when you call navigate() to next page.
app.deleteTimer(tid);               // eliminate a timer you marked down.
app.clearTimers();                  // eliminate all timers you marked down.
```


### Page
- Use this method to create a Page View.
  
```
var myPage = zui.Page({
    title: 'Hey Jude',              // title on page's navigation bar
    
    backButton: function() {        // click callback for a back button, optional. leave the option undefined if you don't need a back button on the navigation bar.
      // do your magic here.
    },
    
    template: $('#tpl-homepage'),   // a underscore template for page content rendering.
    
    model: {                        // data model for template.
      author: 'The Beatles',
      year: '1968',
      style: 'Rock, Pop'
    },
    
    ready: function () {            // a callback who execute immediately after page rendering.
      // do your magic here.
    }
})
```
     