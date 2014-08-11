# Tagga Base Project

### How to Start  
1. Drag the project folder from Finder into CodeKit and Sublime Text.  
2. Click on the Cog, next to Mr. Wonka, to open your Project Settings.  This should be the only time you need to come in here.  
3. Give it a new Icon (if you want) and rename the project.  Try to follow what is given by the Project Manager.  
4. Hit the Close button, and click on Server in the top right of CodeKit.  You will be given two addresses, one is a Bonjour (aka Apple friendly address) and the other a Non-Bonjour (rest of the world) address.  Click on the Bonjour address, and navigate to /app.  This should have a "Welcome to Foundation" index page.  You can open this on your other devices if you would like.  
5. You are ready to start coding!  This should have taken less then 5 minutes, and you already have a base project folder, with Foundation installed and compiled.  

Next, we will cover how to make changes.  There are three folders in the project directory:  

* `/app` - This contains your optimized, ready to deploy build.  You should never need to touch anything in here, unless it is to add images.  Everything else will be compiled and optimized automatically.  
* `/bower_components` - This contains the 3rd party tools we use to build sites.  This won't need to be touched too much, except for Foundation, which will be covered in a bit
* `/build` - This is the meat of your project, and where you will be spending the bulk of your time in.  It has several sections to it, so lets review each of those.  
* `/components` - We are using the .kit language (an extension of HTML) to make our code easy to maintain, reuse, and organize.  Keep with the underscore name convention (this is used to mark the file as an import file).  The two that shouldn't be touched are the `_head.kit` and `_footer.kit` files, unless you know what you are doing.  Anything else, modify as much as you want, duplicate, etc.  `_variables.kit` can control a lot of the project settings.  
* `/scss/ui` - This will contain the files where you will be writing your styles.  Mobile, Tablet, and Desktop should be organized into their respective SASS files, alongside the default sheet.  If you are adding a new Foundation component (for example, Topbar), you will need to navigate to `/build/sccs/foundations.scss` and uncomment the components you are using.  To compile, save the `build.scss`
* `/js`: This contains your `build.coffee` where you will be making any customizations to the default JS behaviours of Foundation, or adding new JS behaviours.  If you are adding a new Foundation component (e.g. Orbit), open the `build.coffee` file.  Add an @ symbol in front codekit-prepend, but leave the file uncommented.  Next, go to Codekit, click on `build.coffee`, then Imports, them click the shields.  CodeKit's JavaScript error checker will have some false-positive errors, ones we don't care about.  If you add new components, remember to save this `build.coffee` file.  
* `index.kit` and your other pages: `index.kit` should give you a good idea of what is going on.  The head.kit import includes your Doctype declaration, the opening HTML tag, the head of the document, and the opening body tag.  The footer.kit includes jQuery from Google's CDN (for caching optimization) and your compiled javascript, as well as the closing body and HTML tags.  Other then those two imports, you can include whatever you want to and however you want.  

In simplest forms, this should be your workflow:  

1. Open the site using the Server button on all the devices you will be testing
2. Determine what Foundation components you will be using, adding the appropriate JS to your `build.coffee` prepends, and uncommenting the `foundations.scss` components.  Save the `build.coffee`, `foundations.scss`, and `build.scss` to compile all your changes.  
3. Next, create your pages in the .kit format, with your head and footer includes.  These will automatically build to the `/app/` directory.  
4. Create or customize the Kit components.  It's recommend that you focus on creating repeatable components, such as a header, and focus on using the `page.kit` files for structure.  
5. Write your styles in the `/build/scss/ui` folder, keeping yourself organized by using the different sass files for various device sizes.  
6. Place all your imagery in the `/app/img` folders, keeping organized and providing multiple sized versions for heavier images.  CodeKit has a built in optimizer, all you need to do is right click on the project icon in CodeKit, and click **Optimize all images in *PROJECT NAME***.
7. Take advantage of CSS & JavaScript source mapping.  


## Animations

Choose which modules you want to use in you project by setting the component to true/false in the `build/scss/animate/_settings.scss` file.

Finally in your markup, simply add the class `animated` to an element, along with any of the animation class names.  

````
    <div class="animated fadeIn">
    	<p>Watch me fade in!</p>
    </div>
````

That's it! You've got a CSS animated element. Super!
