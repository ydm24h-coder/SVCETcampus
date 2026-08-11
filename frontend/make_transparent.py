from PIL import Image

def remove_background_floodfill(image_path, output_path, threshold=30):
    img = Image.open(image_path).convert("RGBA")
    
    # We will do a simple flood fill from the edges to find the background
    width, height = img.size
    pixels = img.load()
    
    # Set of visited pixels
    visited = set()
    queue = []
    
    # Start flood fill from all border pixels
    for x in range(width):
        queue.append((x, 0))
        queue.append((x, height - 1))
    for y in range(height):
        queue.append((0, y))
        queue.append((width - 1, y))
        
    # Get reference background color (top-left pixel)
    bg_color = pixels[0, 0]
    
    def is_similar(c1, c2, thresh):
        return abs(c1[0] - c2[0]) < thresh and abs(c1[1] - c2[1]) < thresh and abs(c1[2] - c2[2]) < thresh
    
    while queue:
        x, y = queue.pop(0)
        
        if (x, y) in visited:
            continue
            
        visited.add((x, y))
        
        current_color = pixels[x, y]
        
        if is_similar(current_color, bg_color, threshold):
            # Make it transparent
            pixels[x, y] = (current_color[0], current_color[1], current_color[2], 0)
            
            # Add neighbors
            if x > 0: queue.append((x - 1, y))
            if x < width - 1: queue.append((x + 1, y))
            if y > 0: queue.append((x, y - 1))
            if y < height - 1: queue.append((x, y + 1))

    img.save(output_path, "PNG")

if __name__ == "__main__":
    remove_background_floodfill("public/logo.png", "public/logo_transparent.png")
    remove_background_floodfill("public/logo.png", "public/favicon_transparent.png")
    print("Done")
