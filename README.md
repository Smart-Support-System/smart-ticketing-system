# Smart Ticketing System

## Introduction

This system is meant to act as a smart ticketing support system, where a user can send support tickets in order to seek help from designated agents.

## System Overview

### Background

* ***Admins***: Have the highest form of functionality and accessibility to viewports when it comes to assigning other users different roles, viewing tickets, and deleting tickets or users from the application (which are housed in a database)  
* ***Agents***: Have a more limited view compared to *Admins*, in which they are able to view tickets from different users, but are not able to permanently delete tickets nor assign users different roles  
* ***Users***: Are able to submit tickets which can then be viewed and solved from *Agents* or *Admins*, and have much more limited viewports that suit a typical user

### Hardware and Software Requirements

* *Prior to download and running this system for the first time, you need to install **Node.js** (for running the frontend, backend, and ticket chat functionality), **PostgreSQL** (in order to run the database), as well as **Git** in order to install the application and its folder directories from the Github repository*  
* For Node.js, type the following into your terminal (without the quotes):  
  * *“npm install”*  
  * ( \* You may have to do this in both the frontend and backend directories of the application)  
* You can download PostgreSQL manually for your device through the [PostgreSQL website](https://www.postgresql.org/download/)

## Administrative Procedures

### Installation

* Now you can install the application and its folder directories by using Git; type the following into your terminal (without the quotes):  
  * *“git clone [https://github.com/Smart-Support-System/smart-ticketing-system.git](https://github.com/Smart-Support-System/smart-ticketing-system.git)”*  
  * ( \* Make sure you are also in the *smart-ticketing-system* directory)  
* ***Configuring the Database***:  
  * After installing the application, make sure that the database has the exact same name as “**DB\_NAME**” in the *.env* file (located in the backend directory)  
  * Once you have a suitable database, make sure that the database query (using the *pgAdmin* tool that came with PostgreSQL) is initialized with *init.sql* (located in the database directory of the application)

### Routine Tasks

* Now you are ready to run the application  
  * At this point, it is recommended that you have two separate terminals open in the application directory:  
    * In the backend directory (without the quotes) type: *“npm run start:dev”*  
    * In the frontend directory (without the quotes) type: *“npm run dev”*  
* After running the these commands in their respective directories, the database will already have a predefined *Admin* account, and the frontend will prompt you with a local link (e.g., [http://localhost:5173/](http://localhost:5173/))  
  * Click on the link, and it will guide you to a login page  
  * Feel free to create any new accounts and tickets using those accounts  
* In the login page, you can use the *Admin* credentials:   
  * ([*test@example.com*](mailto:test@example.com), *password123*)  
  * \* This allows you to access the *Admin* viewports, and view or edit all users and tickets that are in the database

### Periodic Administration

* In order to test full functionality of the application (*User, Agent,* and *Admin* functionality and viewports), it is highly recommended to create new user accounts first, and to login using the predefined *Admin* account in order to assign users different roles  
  * You can later login to these different accounts and test the functionality and viewports of their respective roles

## Troubleshooting

### Dealing with Error Messages and Failures

* If you encounter error messages while running the backend or frontend *npm* commands, then it is highly likely that [Node.js](http://Node.js) is not installed in your system  
  * Make sure that you have it installed (as mentioned in the **Hardware and Software Requirements** section)  
* If you encounter error messages relating to the database, then it is highly likely that the **“DB\_NAME”** variable in your *.env* file (located in the backend directory) is ***not*** the same as the name of your database  
  * Make sure that the name of your database matches the name of **“DB\_NAME”**  
* If you don’t encounter error messages, but notice warnings in the terminal (when running the backend), then it is highly likely that you didn’t initialize your database correctly  
  * Make sure that your database is initialized using the *init.sql* file (located in the database application directory); you can do this by using the *pgAdmin* tool, and accessing the database query

### Known Bugs and Limitations

* This application is session-specific, meaning that if you login to a user while another user is actively logged in, there might be certain bugs as to ticket creation or ticket chat behavior