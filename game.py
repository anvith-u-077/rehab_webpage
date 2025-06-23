import pygame
import sys
import random
import time

pygame.init()

# Colors and Screen
bgcolor = (50, 50, 50)
button_color = (100, 100, 255)
text_color = (255, 255, 255)
width, height = 1000, 600
screen = pygame.display.set_mode((width, height))
pygame.display.set_caption("Hat-trick Game")

# Fonts
font = pygame.font.Font(None, 40)
game_over_font = pygame.font.Font(None, 60)

# Basket and Ball Settings
basket_width_top = 180
basket_width_bottom = 100
basket_height = 80
basket_thickness = 10
ball_speed = 2.0
basket_sensitivity = 10

balls_caught = 0
balls_missed = 0

def create_ball():
    ball = pygame.Surface((50, 50), pygame.SRCALPHA)
    pygame.draw.circle(ball, (255, 0, 0), (25, 25), 25)
    ballrect = ball.get_rect(center=(random.randint(50, width - 50), 50))
    return ball, ballrect

def game_loop(level, total_balls):
    global balls_caught, balls_missed
    balls_caught = 0
    balls_missed = 0

    basketrect = pygame.Rect((width - basket_width_top) // 2, height - 100, basket_width_top, basket_height)
    balls = []
    clock = pygame.time.Clock()
    balls_dropped = 0

    # Start timer
    level_start_time = time.time()
    running = True

    while running:
        clock.tick(60)
        keys = pygame.key.get_pressed()

        for event in pygame.event.get():
            if event.type == pygame.QUIT:
                pygame.quit()
                sys.exit()

        # Basket Movement
        if keys[pygame.K_LEFT]:
            basketrect.move_ip(-basket_sensitivity, 0)
        if keys[pygame.K_RIGHT]:
            basketrect.move_ip(basket_sensitivity, 0)
        basketrect.clamp_ip(screen.get_rect())

        # Drop new balls only when all previous ones are done
        if balls_dropped < total_balls and not balls:
            num_balls = level
            for i in range(min(num_balls, total_balls - balls_dropped)):
                ball, ballrect = create_ball()
                balls.append([ball, ballrect])
                balls_dropped += 1
                pygame.display.flip()
                if i < num_balls - 1:
                    pygame.time.delay(1000)  # 0.3 sec delay between drops in same set

        screen.fill(bgcolor)
        pygame.draw.rect(screen, (255, 255, 255), (0, 50, width, 3))
        pygame.draw.rect(screen, (255, 255, 255), (5, 50, 3, height))
        pygame.draw.rect(screen, (255, 255, 255), (width - 8, 50, 3, height))

        # Draw basket
        top_left = (basketrect.left, basketrect.top)
        top_right = (basketrect.left + basket_width_top, basketrect.top)
        bottom_left = (basketrect.left + (basket_width_top - basket_width_bottom) // 2, basketrect.bottom)
        bottom_right = (basketrect.left + basket_width_top - (basket_width_top - basket_width_bottom) // 2, basketrect.bottom)
        pygame.draw.polygon(screen, (139, 69, 19), [top_left, top_right, bottom_right, bottom_left], 5)
        pygame.draw.line(screen, (139, 69, 19), bottom_left, bottom_right, basket_thickness)

        # Draw stats
        caught_text = font.render(f"Caught: {balls_caught}", True, (0, 255, 0), bgcolor)
        missed_text = font.render(f"Missed: {balls_missed}", True, (255, 0, 0), bgcolor)
        dropped_text = font.render(f"Dropped: {balls_dropped}/{total_balls}", True, text_color, bgcolor)
        screen.blit(caught_text, (width - 220, 10))
        screen.blit(missed_text, (20, 10))
        screen.blit(dropped_text, ((width // 2) - 80, 10))

        # Move and draw balls
        for ball in balls[:]:
            surf, rect = ball
            rect.y += ball_speed
            screen.blit(surf, rect)

            if rect.bottom >= basketrect.top and basketrect.left < rect.centerx < basketrect.right:
                balls_caught += 1
                balls.remove(ball)
            elif rect.bottom >= height:
                balls_missed += 1
                balls.remove(ball)

        pygame.display.flip()

        if balls_dropped >= total_balls and not balls:
            running = False

    # End timer
    level_end_time = time.time()
    time_taken = level_end_time - level_start_time
    total = balls_caught + balls_missed
    success_rate = (balls_caught / total) * 100 if total > 0 else 0

    # Game Over Screen
    screen.fill(bgcolor)
    game_over_text = game_over_font.render("Game Over!", True, text_color)
    success_text = game_over_font.render(f"Success Rate: {success_rate:.2f}%", True, (0, 255, 0))
    time_text = game_over_font.render(f"Time Taken: {time_taken:.1f} sec", True, (255, 255, 0))

    screen.blit(game_over_text, (width // 2 - 100, height // 2 - 70))
    screen.blit(success_text, (width // 2 - 150, height // 2))
    screen.blit(time_text, (width // 2 - 150, height // 2 + 60))

    pygame.display.flip()
    pygame.time.delay(10000)

def main_menu():
    running = True
    while running:
        screen.fill(bgcolor)
        level1 = pygame.Rect(300, 200, 150, 60)
        level2 = pygame.Rect(300, 280, 150, 60)
        level3 = pygame.Rect(300, 360, 150, 60)

        pygame.draw.rect(screen, button_color, level1)
        pygame.draw.rect(screen, button_color, level2)
        pygame.draw.rect(screen, button_color, level3)
        screen.blit(font.render("Level 1", True, text_color), (level1.x + 30, level1.y + 15))
        screen.blit(font.render("Level 2", True, text_color), (level2.x + 30, level2.y + 15))
        screen.blit(font.render("Level 3", True, text_color), (level3.x + 30, level3.y + 15))

        for event in pygame.event.get():
            if event.type == pygame.QUIT:
                running = False
            elif event.type == pygame.MOUSEBUTTONDOWN:
                pos = pygame.mouse.get_pos()
                if level1.collidepoint(pos):
                    game_loop(level=1, total_balls=50)
                elif level2.collidepoint(pos):
                    game_loop(level=2, total_balls=100)
                elif level3.collidepoint(pos):
                    game_loop(level=3, total_balls=150)

        pygame.display.flip()

    pygame.quit()
    sys.exit()

if __name__ == '__main__':
    main_menu()
