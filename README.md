# Table-Selector
##Introdution
A jQuery plugin to make table rows or cells selectable and lists the selected ones. See [demo](https://jsfiddle.net/goforu/a1L3fLnc/).
![row demo](/demo/demo_basic_row.gif?raw=true "Row Type")
![cell demo](/demo/demo_basic_cell.gif?raw=true "Cell Type")
##Getting started
###1.Basic
At first, we import three files into our project. Remeber jquery.js must be imported before seletor.js, cuz selector relies on it.
```html
<link rel="stylesheet" href="../css/selector.css">
<script type="text/javascript" src="../js/lib/jquery.js"></script>
<script type="text/javascript" src="../js/selector.js"></script>
```
Then we add an attribute 'data' to each row so that selector can retrieve selected data once clicked. If we want to retrieve data from cells, we can also add 'data' to each of them.
```html
<tr data="1rd row">
	<td>11</td>
    <td>12</td>
    <td>13</td>
</tr>
```
Then we need a container to hold our selector.
```html
<div id="selector"></div>
```
Finally, we can make our selector work by generating an instance.
```javascript
//target table
$('#target').Selector({
  id: "selector"// seletor id
}).show();
```
###Advanced
####Manipulating data
![button demo](/demo/demo_advanced_button.gif?raw=true "Adding a button")
Sometimes we need to manipulate these selected data, like posting a request, showing a message, ect. Fortunately, selector provides us a very convenient way to handle this.
```javascript
// Add a button to the selector
    selector.addActionButton({
        name: "selected items",
        action: function () {
            alert("You have selected: " + selector.getSelectedItems().join());
        }
    });
```
####Binding a listener
![listener demo](/demo/demo_advanced_listener.gif?raw=true "Binding a listener")
In some cases, our table would be reloaded frequently. But we want table always agrees with data. One way is to call **refreshTable** method everytime reloading table. A more gorgeous way is to add a listener to a certain method which perform these changes. Selector can listen to both sync and async functions.
```javascript
var dataHandler = {
//sync function
  changeWithoutDelay:function(){
    //perform some changes to table
  },
  //async function
  changeWithDelay:function(callback){
    setTimeout(function () {
    //perform some changes to table
      callback();
    }, 2000);
  }
};
// Listen to a sync function
selector.bindListener({
  scope:dataHandler,
  method:"changeWithoutDelay",
  action:function(){
    selector.refreshTable();
  }
});
// Listen to an async function
selector.bindListener({
  scope:dataHandler,
  method:"changeWithDelay",
  action:function(){
    selector.refreshTable();
  },
  aync:0//callback position
});
// Stimulate an async function
```
Binding a listener can do far more work than just that. To know more, please refer to the demo in the repository.
