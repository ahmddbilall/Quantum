import requests

def fetch_nyt_news():
    url = "https://api.nytimes.com/svc/search/v2/articlesearch.json"
    params = {
        'q': 'technology',
        'api-key': 'YOUR_NYT_API_KEY',
    }
    response = requests.get(url, params=params).json()
    return [{
        'title': doc['headline']['main'],
        'full_text': doc.get('lead_paragraph', ''),
        'url': doc['web_url']
    } for doc in response['response']['docs']]



def fetch_guardian_news():
    url = "https://content.guardianapis.com/search"
    params = {
        'api-key': 'YOUR_GUARDIAN_KEY',
        'q': 'technology',
        'show-fields': 'body,headline'
    }
    response = requests.get(url, params=params).json()
    return [{
        'title': item['fields']['headline'],
        'full_text': item['fields']['body'],
        'url': item['webUrl']
    } for item in response['response']['results']]


