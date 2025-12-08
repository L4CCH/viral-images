from fastapi import APIRouter, HTTPException, Depends
from services.data import DataService
from dependencies import get_data_service

router = APIRouter(tags=["images"])


@router.get("/image/{image_id}")
async def get_image_metadata(
    image_id: str,
    data_service: DataService = Depends(get_data_service),
):
    metadata = data_service.get_image(image_id)
    
    if metadata is None:
        raise HTTPException(status_code=404, detail="Image not found")

    return metadata


@router.get("/image/{image_id}/annotation.json")
async def get_iiif_annotation(image_id: str):

    # turn pct into xywz
    # contruct iiif manifest (loc-specific)

    metadata = {
        "@context": "http://iiif.io/api/presentation/3/context.json",
        "id": f"https://PROJECT_URL/image/{image_id}/annotation.json",
        "type": "Annotation",
        "motivation": ["contentState", "tagging"],
        "target": {
            "type": "SpecificResource",
            "source": {
                "id": "IIIF_IMAGE_MANIFEST_https://tile.loc.gov/image-services/iiif/service:ndnp:kyu:batch_kyu_bunting_ver01:data:sn86069123:00202195209:1862111301:0085",
                "type": "Canvas",
                "partOf": [
                    {
                        "id": "IIIF_PRESENTATION_MANIFEST_https://www.loc.gov/item/sn86069123/1862-11-13/ed-1/manifest.json",
                        "type": "Manifest",
                    }
                ],
            },
            "selector": {
                "type": "FragmentSelector",
                "value": "PCT_TRANSFORM_INTO_xywh=1326,508,1702,1841",
            },
        },
        "body": {
            "type": "TextualBody",
            "value": "Published by NEWSPAPER_NAME on PUBLICATION_DATE",
            "format": "text/plain",
            "language": ["en"],
        },
    }

    return metadata
