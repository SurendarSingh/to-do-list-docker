const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");

const app = express();

app.set("view engine", "ejs");

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

mongoose.connect("mongodb+srv://admin-surendar:Test123@todolistcluster.sc2lv.mongodb.net/todolistDB");

const itemsSchema = new mongoose.Schema({
  name: String
});

const Item = mongoose.model("Item", itemsSchema);

const listSchema = new mongoose.Schema({
  name: String,
  items: [itemsSchema]
});

const List = mongoose.model("List", listSchema);

const item1 = new Item({
  name: "Welcome to Todolist!"
});
const item2 = new Item({
  name: "Use + to add Task"
});
const item3 = new Item({
  name: "<-- Checkmark to delete the Task"
});
const defaultItems = [item1, item2, item3];

app.get("/", function(req, res) {
  Item.find({}, function(err, foundItems) {
    if(!foundItems.length) {
      Item.insertMany(defaultItems, function(err) {
        if(err) {
          console.log(err);
        } else {
          console.log("Default items added");
        }
        res.redirect("/");
      });
    } else {
      res.render("list", {listTitle: "Today", newItemsList: foundItems});
    }
  });
});

app.get("/about", function(req, res) {
  res.render("about");
});

app.get("/:customListName", function(req, res) {
  const customListName = _.capitalize(req.params.customListName);

  List.findOne({name: customListName}, function(err, foundList) {
    if(!err) {
      if(!foundList) {
        const list = new List({
          name: customListName,
          items: defaultItems
        });
        list.save();
        res.redirect("/" + customListName);
      } else {
        res.render("list", {listTitle: foundList.name, newItemsList: foundList.items});
      }
    }
  });

});

app.post("/", function(req, res) {
  const itemName = req.body.newItem;
  const listName = req.body.list;

  const newItem = new Item({
    name: itemName
  });
  if(listName == "Today") {
    newItem.save();
    res.redirect("/");
  } else {
    List.findOne({name: listName}, function(err, foundList) {
      foundList.items.push(newItem);
      foundList.save();
    });
    res.redirect("/" + listName);
  }
});

app.post("/delete", function(req, res) {
  const itemId = req.body.checkbox;
  const listName = req.body.listName;

  if(listName === "Today") {
    Item.findByIdAndRemove(itemId, function(err) {
      if(!err) res.redirect("/");
    });
  } else {
    List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: itemId}}}, function(err, foundList) {
      if(!err) res.redirect("/" + listName);
    });
  };
});

let port = process.env.PORT;
if(port == null || port == "") port = 3000;
app.listen(port, function() {
    console.log("Server started successfully.");
});