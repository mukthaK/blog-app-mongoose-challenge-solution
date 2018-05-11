'use strict';

const chai = require('chai');
const chaiHttp = require('chai-http');
const faker = require('faker');
const mongoose = require('mongoose');
const expect = chai.expect;

const {BlogPosts} = require('../models');
const {app, runServer, closeServer} = require('../server');
const {TEST_DATABASE_URL} = require('../config');

chai.use(chaiHttp);

function seedBlogPostsData() {
  console.info('seeding blog posts data');
  const seedData = [];

  for (let i=1; i<=10; i++) {
    seedData.push(generateBlogPostsData());
  }
  // this will return a promise
  return BlogPosts.insertMany(seedData);
}

// used to generate data to put in db
function generateTitleName() {
  const titles = [
    'Manhattan', 'Queens', 'Brooklyn', 'Bronx', 'Staten Island'];
  return titles[Math.floor(Math.random() * titles.length)];
}

// used to generate data to put in db
function generateContent() {
  const content = ['Italian', 'Thai', 'Colombian'];
  return content[Math.floor(Math.random() * content.length)];
}

// used to generate data to put in db
function generateAuthor() {
  const authors = ['A', 'B', 'C', 'D', 'F'];
  const author = authors[Math.floor(Math.random() * authors.length)];
  return {
    firstName: firstName,
    lastname: lastName
  };
}

//generate an object representing a blog post
function generateBlogPostsData() {
	return {
		author: {
	    	firstName: faker.author.firstName(),
	  	  	lastName: faker.author.lastName()
	  	},
	  	title: generateTitleName(),
	  	content: generateContent(),
	  	created: faker.date.past()
	}
}

//deletes the entire db
function tearDownDb() {
  console.warn('Deleting database');
  return mongoose.connection.dropDatabase();
}

describe('Blog posts API resource', function() {
	before(function() {
		return runServer(TEST_DATABASE_URL);
	});

	beforeEach(function() {
		return seedBlogPostsData();
	});

	afterEach(function() {
		return tearDownDb();
	});

	after(function() {
		return closeServer();
	});

	describe('GET endpoint', function() {
		it('should return all the existing blog posts', function() {
			let res;
			return chai.request(app)
			.get('/posts')
			.then(function(_res) {
				res = _res;
				expect(res).to.have.status(200);
				expect(res.body.posts).to.have.lengthOf.at.least(1);
				return BlogPosts.count();
			})
			.then(function(count) {
				expect(res.body.posts).to.have.lengthOf(count);
			});
		});
		it('should return blog posts with right fields', function() {
			let resPost;
			return chai.request(app)
			.get('/posts')
			.then(function(res) {
				expect(res).to.have.status(200);
				expect(res).to.be.json;
				//expect(res.body.posts).to.be.a('array');
				expect(res.body.posts).to.have.lengthOf.at.least(1);

				res.body.posts.forEach(function(post) {
					expect(post).to.be.a('object');
					expect(post).to.include.keys(
						'id', 'title', 'author', 'content');
				});
				resPost = res.body.posts[0];
				return BlogPosts.findById(resPost.id);
			})
			.then(function(post) {
				expect(resPost.id).to.equal(post.id);
				expect(resPost.title).to.equal(post.title);
				expect(resPost.author).to.contain(post.author.firstName);
				expect(resPost.content).to.equal(post.content);
			});
		});
	});

	describe('POST endpoint', function() {
		it('should add a new blog post', function() {
			const newPost = generateBlogPostsData();
			let mostRecentTitle;
			return chai.request(app)
			.post('/posts')
			.then(function(res) {
				expect(res).to.have.status(201);
				expect(res).to.be.json;
				expect(res.body).to.be.a('object');
				expect(res.body).to.include.keys(
					'id', 'title', 'author', 'content');
				expect(res.body.id).to.not.be.null;
				expect(res.body.title).to.equal(newPost.title);
				expect(res.body.author).to.equal(newPost.author);
				expect(res.body.content).to.equal(newPost.content);

				mostRecentTitle = newPost.title;

				expect(res.body.title).to.equal(mostRecentTitle);
				return BlogPosts.findById(res.body.id);
			})
			.then(function(post) {
				expect(post.title).to.equal(newPost.title);
				expect(post.content).to.equal(newPost.content);
				expect(post.author.firstName).to.equal(newPost.author.firstName);
				expect(post.author.lastName).to.equal(newPost.author.lastName);
			});
		});
	});

	describe('PUT endpoint', function() {
		it('should update fields you send over', function() {
			const updateData = {
				title: '50 things you dont know',
				content: 'Lorem ipsum dolor sit amet, consectetur adipisicing elit'
			};

			return BlogPosts
			.findOne()
			.then(function(post) {
				updateData.id = post.id;

				return chai.request(app)
				.put(`/posts/${post.id}`)
				.send(updateData);
			})
			.then(function(res) {
				expect(res).to.have.status(204);
				return BlogPosts.findById(updateData.id);
			})
			.then(function(post) {
				expect(post.title).to.equal(updateData.title);
				expect(post.content).to.equal(updateData.content);
			});
		});
	});

	describe('DELETE endpoint', function() {
		it('delete a blog post by id', function() {
			let post;
			return BlogPosts
			.findOne()
			.then(function(_post) {
				post = _post;
				return chai.request(app).delete(`/posts/${post.id}`);
			})
			.then(function(res) {
				expect(res).to.have.status(204);
				return BlogPosts.findById(post.id);
			})
			.then(function(_post) {
				expect(_post).to.be.null;
			});
		});
	});
});









