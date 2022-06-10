const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const verify = require("../middleware/verify");
const Post = mongoose.model("Post");
const User = require("../models/user");

router.get("/allpost", verify, async (req, res) => {
  try {
    const post = await Post.find()
      .sort("-createdAt")
      .populate("postedBy", "_id firstname lastname")
      .populate("comments.postedBy", "_id firstname lastname");
    res.json({ post });
  } catch (error) {
    return res.status(401).send("Error");
  }
});

router.post("/createpost", verify, (req, res) => {
  const { title, description, url } = req.body.data1;

  if (!title || !description || !url) {
    return res.status(422).json({ error: "Plase add all the fields" });
  }
  req.user.password = undefined;
  const post = new Post({
    title,
    description,
    image: url,
    postedBy: req.user,
  });
  post
    .save()
    .then((result) => {
      res.json({ post: result });
    })
    .catch((err) => {
      console.log(err);
    });
});

router.put("/likepost", verify, (req, res) => {
  Post.findByIdAndUpdate(
    req.body.postId,
    {
      $push: { likes: req.user._id },
    },
    {
      new: true,
    }
  ).exec((err, result) => {
    if (err) {
      return res.status(422).json({ error: err });
    } else {
      res.json(result);
    }
  });
});
router.put("/unlikepost", verify, (req, res) => {
  Post.findByIdAndUpdate(
    req.body.postId,
    {
      $pull: { likes: req.user._id },
    },
    {
      new: true,
    }
  ).exec((err, result) => {
    if (err) {
      return res.status(422).json({ error: err });
    } else {
      res.json(result);
    }
  });
});

router.put("/comment", verify, (req, res) => {
  const comment = {
    text: req.body.text,
    postedBy: req.user._id,
  };

  Post.findByIdAndUpdate(
    req.body.postId,
    {
      $push: { comments: comment },
    },
    {
      new: true,
    }
  )
    .populate("comments.postedBy", "_id firstname lastname")
    .populate("postedBy", "_id firstname lastname")
    .exec((err, result) => {
      if (err) {
        return res.status(422).json({ error: err });
      } else {
        res.json(result);
      }
    });
});

router.delete("/deletepost/:postId", verify, (req, res) => {
  Post.findOne({ _id: req.params.postId })
    .populate("postedBy", "_id")
    .exec((err, res) => {
      if (err || !res) {
        return res.status(422).send({ error: err });
      }
      console.log("in delete", req.user.isAdmin);
      if (req.user.isAdmin) {
        res
          .remove()
          .then((result) => {
            res.json({ message: "Successfully Deleted" });
          })
          .catch((err) => {
            console.log(err);
          });
      }

      if (res.postedBy._id.toString() === req.user._id.toString()) {
        res
          .remove()
          .then((result) => {
            res.json({ message: "Successfully Deleted" });
          })
          .catch((err) => {
            console.log(err);
          });
      }
    });
});

router.get("/mypost", verify, (req, res) => {
  Post.find({ postedBy: req.user._id })
  .sort("-createdAt")
    .populate("postedBy", "_id firstname")
    .populate("comments.postedBy", "_id firstname lastname")
    .then((mypost) => {
      res.json({ mypost });
    })
    .catch((err) => {
      console.log(err);
    });
});

router.put("/follow", verify, (req, res) => {
  User.findByIdAndUpdate(
    req.body.followId,
    {
      $push: { followers: req.user._id },
    },
    {
      new: true,
    },
    (err, result) => {
      if (err) {
        return res.status(422).json({ error: err });
      }
      User.findByIdAndUpdate(
        req.user._id,
        {
          $push: { following: req.body.followId },
        },
        { new: true }
      )
        .select("-password")
        .then((result) => {
          res.json(result);
        })
        .catch((err) => {
          return res.status(422).json({ error: err });
        });
    }
  );
});
router.put("/unfollow", verify, (req, res) => {
  User.findByIdAndUpdate(
    req.body.unfollowId,
    {
      $pull: { followers: req.user._id },
    },
    {
      new: true,
    },
    (err, result) => {
      if (err) {
        return res.status(422).json({ error: err });
      }
      User.findByIdAndUpdate(
        req.user._id,
        {
          $pull: { following: req.body.unfollowId },
        },
        { new: true }
      )
        .select("-password")
        .then((result) => {
          res.json(result);
        })
        .catch((err) => {
          return res.status(422).json({ error: err });
        });
    }
  );
});

module.exports = router;
