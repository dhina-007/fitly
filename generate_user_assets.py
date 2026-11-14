import os
from PIL import Image, ImageFilter, ImageDraw

def create_app_assets():
    dark_path = '/Users/dhinagar/.gemini/antigravity/brain/fb2ac3ff-da58-452d-86bd-fd7e026ef7df/media__1791825194874.jpg'
    transparent_path = '/Users/dhinagar/.gemini/antigravity/brain/fb2ac3ff-da58-452d-86bd-fd7e026ef7df/media__1791825209739.png'
    
    im_dark = Image.open(dark_path).convert('RGBA')
    im_trans = Image.open(transparent_path).convert('RGBA')
    
    # 1. Save transparent logo to mobile/assets/fitly-logo.png
    im_trans.save('mobile/assets/fitly-logo.png', format='PNG')
    print("Saved mobile/assets/fitly-logo.png")
    
    # 2. Master App Icon (1024x1024)
    # The user provided im_dark as the app icon. Let's make sure it's 1024x1024 PNG.
    # To make it look edge-to-edge premium, let's create a full-bleed dark gradient canvas:
    # Top-to-bottom dark emerald-teal vignette:
    full_bleed = Image.new('RGBA', (1024, 1024), (2, 28, 26, 255))
    
    # Let's extract the subtle radial aura from im_dark or composite im_trans cleanly:
    # In im_dark, the squircle contains an emerald radial aura.
    # Let's create a radial glow in the center:
    glow = Image.new('RGBA', (1024, 1024), (0, 0, 0, 0))
    glow_draw = ImageDraw.Draw(glow)
    for r in range(450, 0, -15):
        alpha = int(45 * (1 - r / 450))
        glow_draw.ellipse(
            [(512 - r, 480 - r), (512 + r, 480 + r)],
            fill=(4, 120, 87, alpha)
        )
    glow = glow.filter(ImageFilter.GaussianBlur(radius=50))
    full_bleed.alpha_composite(glow)
    
    # Center the logo from im_trans onto the full-bleed canvas:
    # Size: fit within ~820x820 for perfect safe margin
    logo_resized = im_trans.copy()
    logo_resized.thumbnail((840, 840), Image.Resampling.LANCZOS)
    offset_x = (1024 - logo_resized.width) // 2
    offset_y = (1024 - logo_resized.height) // 2
    full_bleed.alpha_composite(logo_resized, (offset_x, offset_y))
    
    # Save full_bleed as icon.png
    full_bleed.save('mobile/assets/icon.png', format='PNG')
    print("Saved mobile/assets/icon.png (full-bleed 1024x1024)")
    
    # Also save the exact user uploaded squircle image as mobile/assets/icon-squircle.png
    im_dark.save('mobile/assets/icon-squircle.png', format='PNG')
    print("Saved mobile/assets/icon-squircle.png")
    
    # 3. Splash Icon (1024x1024):
    # Expo splash screen: transparent or centered logo
    splash = Image.new('RGBA', (1024, 1024), (0, 0, 0, 0))
    splash_logo = im_trans.copy()
    splash_logo.thumbnail((720, 720), Image.Resampling.LANCZOS)
    s_x = (1024 - splash_logo.width) // 2
    s_y = (1024 - splash_logo.height) // 2
    splash.alpha_composite(splash_logo, (s_x, s_y))
    splash.save('mobile/assets/splash-icon.png', format='PNG')
    print("Saved mobile/assets/splash-icon.png")
    
    # 4. Android Adaptive Icon Foreground (512x512 with safe area margin)
    android_fg = Image.new('RGBA', (512, 512), (0, 0, 0, 0))
    android_logo = im_trans.copy()
    # In Android adaptive icons, the safe zone is inner 66% (338x338)
    android_logo.thumbnail((360, 360), Image.Resampling.LANCZOS)
    a_x = (512 - android_logo.width) // 2
    a_y = (512 - android_logo.height) // 2
    android_fg.alpha_composite(android_logo, (a_x, a_y))
    android_fg.save('mobile/assets/android-icon-foreground.png', format='PNG')
    print("Saved mobile/assets/android-icon-foreground.png")
    
    # Android Background (512x512)
    android_bg = Image.new('RGBA', (512, 512), (2, 28, 26, 255))
    android_bg.save('mobile/assets/android-icon-background.png', format='PNG')
    print("Saved mobile/assets/android-icon-background.png")
    
    # 5. Favicon (48x48)
    fav = Image.new('RGBA', (48, 48), (2, 28, 26, 255))
    fav_logo = im_trans.copy()
    fav_logo.thumbnail((44, 44), Image.Resampling.LANCZOS)
    f_x = (48 - fav_logo.width) // 2
    f_y = (48 - fav_logo.height) // 2
    fav.alpha_composite(fav_logo, (f_x, f_y))
    fav.save('mobile/assets/favicon.png', format='PNG')
    print("Saved mobile/assets/favicon.png")
    
    # 6. Isolated Emblem (human figure without text) for small header badges
    # Crop the upper figure from im_trans:
    # Bounding box of im_trans is (20, 25, 1019, 1024)
    # The figure is in the top 72% of the image, the word "Fitly" is at the bottom 28%
    figure_crop = im_trans.crop((20, 25, 1019, 740))
    figure_crop.save('mobile/assets/fitly-figure.png', format='PNG')
    print("Saved mobile/assets/fitly-figure.png")

if __name__ == '__main__':
    create_app_assets()
