# Prompts

This file catures some of the prompts that are used to build the application. 

## Initial Prompt for Claude-3.7-Sonnet Agent Mode

I want to build a Vue3 application using the Composition API and Java Script 20, with Vite, Pinia Store and Tailwind CSS. 
The application should use best coding practice. I do not want to use Typescript. 

The application should implement a Login Screen with the Eagle Eye API https://developer.eagleeyenetworks.com/reference/using-the-api using OAuth2.
Please implement a proxy for the OAuth calls with a Vite plugin to handle CORS issues. Credentials needed for the login, such as the Client-ID, 
Client-Secret, and redirect URI should be stored locally in a .env file. Note that the redirect URL should be http://127.0.0.1:3333

After successful login we should be on a "Home" page for the application. Please create a second page with "About" information,
and a third page with "Settings". 
We will implement multiple other pages later. The user can navigation 
between the pages with Hamburger-style pulldown menu that expands dynamically. Initially, the menu options should include the 
three available pages plus a logout option, which navigates back to the login screen and removes all credentials that may have been 
stored for the session or locally.

The application is intended to be a building block for many future applications. So we need a well structured Readme.md with instructions for 
cloning or forking the application and customize this framework with additional content and features. The configuration steps should also 
be captured in the README.md, and any other information that will help with the reuse of the application. 

## Followup: responsive
add a mobile-friendly navigation menu. The application should be responsive for use on PC, tablet and mobile devices. 

## followup: run the app
npm install
npm run dev

## followup: Warning about [MODULE_TYPELESS_PACKAGE_JSON]
fix the warning

## followup: login and navigation menu
The login page should not show the navigation menu