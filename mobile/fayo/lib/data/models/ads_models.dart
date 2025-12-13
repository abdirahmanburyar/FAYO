enum AdStatus {
  inactive,
  published,
}

class AdDto {
  final String id;
  final String company;
  final String image;
  final String startDate;
  final String endDate;
  final int range;
  final AdStatus status;
  final int clickCount;
  final int viewCount;
  final String? createdBy;
  final String? createdAt;
  final String? updatedAt;

  AdDto({
    required this.id,
    required this.company,
    required this.image,
    required this.startDate,
    required this.endDate,
    required this.range,
    this.status = AdStatus.inactive,
    this.clickCount = 0,
    this.viewCount = 0,
    this.createdBy,
    this.createdAt,
    this.updatedAt,
  });

  factory AdDto.fromJson(Map<String, dynamic> json) {
    return AdDto(
      id: json['id'] ?? '',
      company: json['company'] ?? '',
      image: json['image'] ?? '',
      startDate: json['startDate'] ?? '',
      endDate: json['endDate'] ?? '',
      range: json['range'] ?? 0,
      status: _parseAdStatus(json['status']),
      clickCount: json['clickCount'] ?? 0,
      viewCount: json['viewCount'] ?? 0,
      createdBy: json['createdBy'],
      createdAt: json['createdAt'],
      updatedAt: json['updatedAt'],
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'company': company,
        'image': image,
        'startDate': startDate,
        'endDate': endDate,
        'range': range,
        'status': status.name.toUpperCase(),
        'clickCount': clickCount,
        'viewCount': viewCount,
        'createdBy': createdBy,
        'createdAt': createdAt,
        'updatedAt': updatedAt,
      };

  static AdStatus _parseAdStatus(dynamic status) {
    if (status is String) {
      switch (status.toUpperCase()) {
        case 'PUBLISHED':
          return AdStatus.published;
        case 'INACTIVE':
        default:
          return AdStatus.inactive;
      }
    }
    return AdStatus.inactive;
  }
}

class AdUpdateEvent {
  final String type;
  final AdDto? ad;
  final String? adId;
  final String? timestamp;

  AdUpdateEvent({
    required this.type,
    this.ad,
    this.adId,
    this.timestamp,
  });

  factory AdUpdateEvent.fromJson(Map<String, dynamic> json) {
    return AdUpdateEvent(
      type: json['type'] ?? '',
      ad: json['ad'] != null ? AdDto.fromJson(json['ad']) : null,
      adId: json['adId'],
      timestamp: json['timestamp'],
    );
  }
}

