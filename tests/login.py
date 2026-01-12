from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC


# Only works in windows for most PCs, exception because my edge doesn't work but brave does
def get_driver() -> webdriver.Edge | webdriver.Chrome:
    options = webdriver.EdgeOptions()
    options.add_experimental_option("detach", True)
    try:
        return webdriver.Edge(options=options)
    except Exception:
        from selenium.webdriver.chrome.options import Options
        options = Options()
        options.binary_location = r"C:\Program Files\BraveSoftware\Brave-Browser\Application\brave.exe"
        options.add_experimental_option("detach", True)
        return webdriver.Chrome(options=options)


def get_login(email:str, password:str) -> webdriver.Edge | webdriver.Chrome:
    driver = get_driver()
    driver.get("https://medi-follow.vercel.app/login") 
    
    username_field = WebDriverWait(driver, 10).until(
        EC.presence_of_element_located((By.ID, "email")) 
    )
    username_field.send_keys(email)

    password_field = WebDriverWait(driver, 10).until(
        EC.presence_of_element_located((By.ID, "password"))
    )
    password_field.send_keys(password)

    driver.find_element(By.CSS_SELECTOR, 'button[type="submit"]').click()

    WebDriverWait(driver, 15).until(EC.title_is("MediFollow - Healthcare Management Platform"))
    print(f"Login successful as user, {email}! Page title is:", driver.title)

    return driver