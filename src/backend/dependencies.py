from fastapi import Request
from services.data import DataService

def get_data_service(request: Request) -> DataService:
    return request.app.state.data_service
