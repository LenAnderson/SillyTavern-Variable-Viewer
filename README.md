# Video Backgrounds

A slightly hacky way to use video backgrounds in SillyTavern.




## Installation

Use ST's inbuilt extension installer with this URL:  
https://github.com/LenAnderson/SillyTavern-VideoBackgrounds/




## Usage

- Use your file explorer to place the video file you want to use into SillyTavern's backgrounds folder:  
`.../SillyTavern/public/backgrounds/`
- Place any image file with the exact same name (including the video's filename extension) plus the image files extension into the backgrounds folder.  
Example:  
video file: `MyVideo.mp4`  
image file: `MyVideo.mp4.jpg`
- Start / reload SillyTavern and select the image file as your background.

SillyTavern does not support video backgrounds and hence does not allow to upload video files as backgrounds and also does not list any videos saved in the backgrounds folder. As a workaround, the image file is used to find and select the background. This extension will then check if a corresponding video file exists and use the video as the background instead.




## Requirements

SillyTavern version >=1.10.10